import { randomUUID } from "crypto";
import { prisma } from "@agenttoruk/database";
import type { IngestInput, RagChunk, RagSearchParams } from "@agenttoruk/shared";
import { chunkText, estimateTokenCount } from "../chunk";
import { embedQuery, embedTexts, vectorToSql } from "../embeddings";
import type { RagProvider, RagProviderConfig } from "../types";

export class PgVectorRagProvider implements RagProvider {
  readonly name = "pgvector" as const;
  private readonly config: RagProviderConfig;

  constructor(config: RagProviderConfig) {
    this.config = config;
  }

  async ingest(input: IngestInput): Promise<void> {
    const apiKey = this.config.openaiApiKey;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY required for pgvector embeddings");
    }

    const content = input.content?.trim();
    if (!content) {
      throw new Error("No content to ingest");
    }

    await prisma.knowledgeDocument.update({
      where: { id: input.documentId },
      data: { status: "PROCESSING", errorMessage: null },
    });

    try {
      await prisma.knowledgeChunk.deleteMany({
        where: { documentId: input.documentId },
      });

      const chunks = chunkText(content);
      if (chunks.length === 0) {
        throw new Error("Document produced no text chunks");
      }

      const embeddings = await embedTexts(chunks, apiKey);

      for (let i = 0; i < chunks.length; i++) {
        const id = randomUUID();
        const vector = vectorToSql(embeddings[i]);

        await prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, document_id, content, chunk_index, token_count, embedding, created_at)
           VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())`,
          id,
          input.documentId,
          chunks[i],
          i,
          estimateTokenCount(chunks[i]),
          vector,
        );
      }

      await prisma.knowledgeDocument.update({
        where: { id: input.documentId },
        data: {
          status: "INDEXED",
          errorMessage: null,
          metadata: {
            chunkCount: chunks.length,
            indexedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Indexing failed";
      await prisma.knowledgeDocument.update({
        where: { id: input.documentId },
        data: { status: "FAILED", errorMessage: message },
      });
      throw error;
    }
  }

  async search(params: RagSearchParams): Promise<RagChunk[]> {
    const apiKey = this.config.openaiApiKey;
    if (!apiKey) {
      return [];
    }

    const limit = params.limit ?? 5;
    const minScore = params.minScore ?? 0.5;

    const queryEmbedding = await embedQuery(params.query, apiKey);
    const vector = vectorToSql(queryEmbedding);

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        document_id: string;
        document_name: string;
        score: number;
      }>
    >(
      `SELECT
        kc.id,
        kc.content,
        kc.document_id,
        kd.name AS document_name,
        1 - (kc.embedding <=> $1::vector) AS score
      FROM knowledge_chunks kc
      INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kd.organization_id = $2
        AND kd.status = 'INDEXED'
        AND kc.embedding IS NOT NULL
      ORDER BY kc.embedding <=> $1::vector
      LIMIT $3`,
      vector,
      params.organizationId,
      limit,
    );

    return rows
      .filter((row) => row.score >= minScore)
      .map((row) => ({
        id: row.id,
        content: row.content,
        documentId: row.document_id,
        documentName: row.document_name,
        score: row.score,
      }));
  }

  async delete(documentId: string, _organizationId: string): Promise<void> {
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });
  }
}

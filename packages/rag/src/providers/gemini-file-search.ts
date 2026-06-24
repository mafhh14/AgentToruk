import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@agenttoruk/database";
import type { IngestInput, RagChunk, RagSearchParams } from "@agenttoruk/shared";
import {
  extractDocumentName,
  GeminiFileSearchClient,
} from "../gemini/client";
import type { RagProvider, RagProviderConfig } from "../types";

function mimeFromSource(
  sourceType: IngestInput["sourceType"],
  mimeType?: string,
): string {
  if (mimeType) return mimeType;
  switch (sourceType) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "url":
    case "txt":
    default:
      return "text/plain";
  }
}

export class GeminiFileSearchProvider implements RagProvider {
  readonly name = "gemini_file_search" as const;
  private readonly config: RagProviderConfig;
  private client: GeminiFileSearchClient | null = null;

  constructor(config: RagProviderConfig) {
    this.config = config;
  }

  private getClient(): GeminiFileSearchClient {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY required for Gemini File Search");
    }

    if (!this.client) {
      this.client = new GeminiFileSearchClient(
        apiKey,
        this.config.geminiSearchModel,
      );
    }

    return this.client;
  }

  private async ensureStore(organizationId: string): Promise<string> {
    const agentConfig = await prisma.agentConfig.findUnique({
      where: { organizationId },
      select: { geminiFileSearchStoreId: true },
    });

    if (agentConfig?.geminiFileSearchStoreId) {
      return agentConfig.geminiFileSearchStoreId;
    }

    const client = this.getClient();
    const store = await client.createStore(
      `agenttoruk-${organizationId.slice(0, 24)}`,
    );

    await prisma.agentConfig.update({
      where: { organizationId },
      data: { geminiFileSearchStoreId: store.name },
    });

    return store.name;
  }

  async ingest(input: IngestInput): Promise<void> {
    const client = this.getClient();

    await prisma.knowledgeDocument.update({
      where: { id: input.documentId },
      data: { status: "PROCESSING", errorMessage: null },
    });

    try {
      const storeName = await this.ensureStore(input.organizationId);
      const mimeType = mimeFromSource(input.sourceType, input.mimeType);
      const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      let data: Buffer;
      let filename: string;

      if (input.filePath) {
        data = await readFile(input.filePath);
        filename = path.basename(input.filePath).replace(/^[^_]+_/, "");
      } else {
        const text = input.content?.trim();
        if (!text) {
          throw new Error("No content to ingest");
        }
        data = Buffer.from(text, "utf-8");
        filename = `${safeName || "document"}.txt`;
      }

      const operation = await client.uploadToStore({
        storeName,
        displayName: input.name,
        mimeType,
        data,
        filename,
        customMetadata: [
          { key: "organizationId", stringValue: input.organizationId },
          { key: "documentId", stringValue: input.documentId },
        ],
      });

      const completed = await client.waitForOperation(operation);
      const externalId = extractDocumentName(completed);

      await prisma.knowledgeDocument.update({
        where: { id: input.documentId },
        data: {
          status: "INDEXED",
          errorMessage: null,
          externalId: externalId ?? undefined,
          externalStoreId: storeName,
          metadata: {
            provider: "gemini_file_search",
            indexedAt: new Date().toISOString(),
            externalDocumentId: externalId,
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gemini indexing failed";
      await prisma.knowledgeDocument.update({
        where: { id: input.documentId },
        data: { status: "FAILED", errorMessage: message },
      });
      throw error;
    }
  }

  async search(params: RagSearchParams): Promise<RagChunk[]> {
    const client = this.getClient();
    const limit = params.limit ?? 5;
    const minScore = params.minScore ?? 0.5;

    const agentConfig = await prisma.agentConfig.findUnique({
      where: { organizationId: params.organizationId },
      select: { geminiFileSearchStoreId: true },
    });

    const storeName = agentConfig?.geminiFileSearchStoreId;
    if (!storeName) {
      return [];
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where: {
        organizationId: params.organizationId,
        status: "INDEXED",
        externalStoreId: storeName,
      },
      select: { id: true, name: true, externalId: true },
    });

    if (documents.length === 0) {
      return [];
    }

    const documentIdMap = new Map<string, { id: string; name: string }>();
    for (const doc of documents) {
      if (doc.externalId) {
        documentIdMap.set(doc.externalId, { id: doc.id, name: doc.name });
      }
      documentIdMap.set(doc.id, { id: doc.id, name: doc.name });
    }

    const chunks = await client.searchStore({
      storeName,
      query: params.query,
      limit,
      documentIdMap,
    });

    return chunks.filter((chunk) => chunk.score >= minScore);
  }

  async delete(documentId: string, organizationId: string): Promise<void> {
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: documentId, organizationId },
      select: { externalId: true },
    });

    if (!doc?.externalId) return;

    const client = this.getClient();
    await client.deleteDocument(doc.externalId);
  }
}

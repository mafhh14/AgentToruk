import type {
  IngestInput,
  RagChunk,
  RagSearchParams,
} from "@agenttoruk/shared";
import type { RagProvider, RagProviderConfig } from "../types";

/**
 * PostgreSQL + pgvector RAG provider.
 * Full implementation in Phase 7 (chunking, embedding, similarity search).
 */
export class PgVectorRagProvider implements RagProvider {
  readonly name = "pgvector" as const;
  private readonly config: RagProviderConfig;

  constructor(config: RagProviderConfig) {
    this.config = config;
    if (!config.databaseUrl && !config.openaiApiKey) {
      console.warn(
        "[PgVectorRagProvider] databaseUrl and openaiApiKey required for full RAG pipeline",
      );
    }
  }

  async ingest(_input: IngestInput): Promise<void> {
    throw new Error(
      "PgVectorRagProvider.ingest not implemented yet — see Phase 7",
    );
  }

  async search(_params: RagSearchParams): Promise<RagChunk[]> {
    throw new Error(
      "PgVectorRagProvider.search not implemented yet — see Phase 7",
    );
  }

  async delete(_documentId: string, _organizationId: string): Promise<void> {
    throw new Error(
      "PgVectorRagProvider.delete not implemented yet — see Phase 7",
    );
  }
}

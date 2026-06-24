import type {
  IngestInput,
  RagChunk,
  RagSearchParams,
} from "@agenttoruk/shared";

export interface RagProvider {
  readonly name: "pgvector" | "gemini_file_search";
  ingest(input: IngestInput): Promise<void>;
  search(params: RagSearchParams): Promise<RagChunk[]>;
  delete(documentId: string, organizationId: string): Promise<void>;
  reindex?(documentId: string, organizationId: string): Promise<void>;
}

export interface RagProviderConfig {
  openaiApiKey?: string;
  geminiApiKey?: string;
  geminiSearchModel?: string;
  databaseUrl?: string;
}

import type { RagProviderName } from "@agenttoruk/shared";
import type { RagProviderConfig } from "./types";
import type { RagProvider } from "./types";
import { GeminiFileSearchProvider } from "./providers/gemini-file-search";
import { PgVectorRagProvider } from "./providers/pgvector";

export function createRagProvider(
  name: RagProviderName,
  config: RagProviderConfig,
): RagProvider {
  switch (name) {
    case "pgvector":
      return new PgVectorRagProvider(config);
    case "gemini_file_search":
      return new GeminiFileSearchProvider(config);
    default:
      throw new Error(`Unsupported RAG provider: ${name}`);
  }
}

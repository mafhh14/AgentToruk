import type {
  IngestInput,
  RagChunk,
  RagSearchParams,
} from "@agenttoruk/shared";
import type { RagProvider, RagProviderConfig } from "../types";

/**
 * Google Gemini File Search RAG provider.
 * Full implementation in Phase 7 (store creation, upload, grounded query).
 */
export class GeminiFileSearchProvider implements RagProvider {
  readonly name = "gemini_file_search" as const;
  private readonly config: RagProviderConfig;

  constructor(config: RagProviderConfig) {
    this.config = config;
    if (!config.geminiApiKey) {
      console.warn(
        "[GeminiFileSearchProvider] geminiApiKey required for File Search",
      );
    }
  }

  async ingest(_input: IngestInput): Promise<void> {
    throw new Error(
      "GeminiFileSearchProvider.ingest not implemented yet — see Phase 7",
    );
  }

  async search(_params: RagSearchParams): Promise<RagChunk[]> {
    throw new Error(
      "GeminiFileSearchProvider.search not implemented yet — see Phase 7",
    );
  }

  async delete(_documentId: string, _organizationId: string): Promise<void> {
    throw new Error(
      "GeminiFileSearchProvider.delete not implemented yet — see Phase 7",
    );
  }
}

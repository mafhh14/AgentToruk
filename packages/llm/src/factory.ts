import type { LlmProviderName } from "@agenttoruk/shared";
import type { LlmProvider, LlmProviderConfig } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAiProvider } from "./providers/openai";

export function createLlmProvider(
  name: LlmProviderName,
  config: LlmProviderConfig,
): LlmProvider {
  switch (name) {
    case "openai":
      return new OpenAiProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default:
      throw new Error(`Unsupported LLM provider: ${name}`);
  }
}

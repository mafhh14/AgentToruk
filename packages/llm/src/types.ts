import type { ChatParams, ChatResponse, LlmProviderName } from "@agenttoruk/shared";

export interface LlmProvider {
  readonly name: LlmProviderName;
  chat(params: ChatParams): Promise<ChatResponse>;
}

export interface LlmProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

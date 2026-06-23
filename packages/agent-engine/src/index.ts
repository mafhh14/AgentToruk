import type {
  AgentContext,
  AgentResult,
  ChatMessage,
  LlmProviderName,
  RagProviderName,
} from "@agenttoruk/shared";
import { createLlmProvider } from "@agenttoruk/llm";

export interface AgentEngineConfig {
  llmProvider: LlmProviderName;
  llmModel: string;
  ragProvider: RagProviderName;
  openaiApiKey?: string;
  geminiApiKey?: string;
  systemPrompt: string;
  confidenceThreshold: number;
}

export interface IAgentEngine {
  processMessage(
    context: AgentContext,
    userMessage: string,
  ): Promise<AgentResult>;
}

export class AgentEngine implements IAgentEngine {
  constructor(private readonly config: AgentEngineConfig) {}

  async processMessage(
    context: AgentContext,
    userMessage: string,
  ): Promise<AgentResult> {
    const apiKey =
      this.config.llmProvider === "openai"
        ? this.config.openaiApiKey
        : this.config.geminiApiKey;

    if (!apiKey) {
      throw new Error(`API key required for ${this.config.llmProvider}`);
    }

    const llm = createLlmProvider(this.config.llmProvider, { apiKey });

    const messages: ChatMessage[] = [
      { role: "system", content: this.config.systemPrompt },
      ...context.messages,
      { role: "user", content: userMessage },
    ];

    const response = await llm.chat({
      model: this.config.llmModel,
      messages,
      temperature: 0.7,
    });

    const confidence = response.confidence ?? 0.85;

    return {
      response: response.content,
      confidence,
      handoff: confidence < this.config.confidenceThreshold,
      handoffReason:
        confidence < this.config.confidenceThreshold
          ? "Low confidence response"
          : undefined,
    };
  }
}

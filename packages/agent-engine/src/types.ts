import type { AgentContext, RagChunk } from "@agenttoruk/shared";

export type IntentCategory =
  | "faq"
  | "billing"
  | "refund"
  | "order_status"
  | "technical"
  | "appointment"
  | "complaint"
  | "human_request"
  | "general";

export type UrgencyLevel = "low" | "medium" | "high";
export type SentimentLevel = "neutral" | "frustrated" | "angry";
export type RiskLevel = "low" | "medium" | "high";

export interface IntentAnalysis {
  intent: IntentCategory;
  urgency: UrgencyLevel;
  sentiment: SentimentLevel;
  riskLevel: RiskLevel;
  requiresHuman: boolean;
  missingEntities: string[];
  summary: string;
}

export interface PlannedTool {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentPlan {
  tools: PlannedTool[];
  reasoning: string;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  output: Record<string, unknown>;
  error?: string;
}

export interface ToolRuntime {
  execute(
    name: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<ToolExecutionResult>;
}

export interface GuardrailResult {
  allowed: boolean;
  message?: string;
  flags?: string[];
}

export interface OrchestratorLogSink {
  log(stage: string, data: Record<string, unknown>, durationMs?: number): Promise<void>;
}

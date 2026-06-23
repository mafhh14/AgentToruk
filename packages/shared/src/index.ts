export type LlmProviderName = "openai" | "gemini";
export type RagProviderName = "pgvector" | "gemini_file_search";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  confidence?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RagChunk {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface IngestInput {
  organizationId: string;
  documentId: string;
  name: string;
  sourceType: "pdf" | "docx" | "txt" | "url";
  content?: string;
  filePath?: string;
  sourceUrl?: string;
  mimeType?: string;
}

export interface RagSearchParams {
  organizationId: string;
  query: string;
  limit?: number;
  minScore?: number;
}

export interface AgentContext {
  organizationId: string;
  conversationId: string;
  messages: ChatMessage[];
  visitorEmail?: string;
  visitorName?: string;
}

export interface AgentResult {
  response: string;
  confidence: number;
  sources?: RagChunk[];
  toolCalls?: ToolCall[];
  handoff?: boolean;
  handoffReason?: string;
  intent?: string;
  sentiment?: string;
  urgency?: string;
  actionsTaken?: string[];
  stages?: AgentStageLog[];
}

export interface AgentStageLog {
  stage: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  durationMs?: number;
}

export interface WidgetThemeConfig {
  welcomeMessage: string;
  position: string;
  themeMode: "light" | "dark" | "auto";
  allowUserThemeToggle: boolean;
  light: {
    primary: string;
    background: string;
    text: string;
    agentBubble: string;
    userBubble: string;
  };
  dark: {
    primary: string;
    background: string;
    text: string;
    agentBubble: string;
    userBubble: string;
  };
  fontFamily: string;
  fontSize: string;
  borderRadius: number;
  showPoweredBy: boolean;
}

export const TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;

export const MEMBERSHIP_ROLES = [
  "OWNER",
  "ADMIN",
  "SUPPORT_AGENT",
  "VIEWER",
] as const;

export const APP_NAME = "AgentToruk";
export const APP_TAGLINE =
  "Open-source AI agents that understand, decide, and solve real-world user issues.";

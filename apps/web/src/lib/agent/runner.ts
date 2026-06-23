import type { ChatMessage } from "@agenttoruk/shared";
import {
  AgentOrchestrator,
  type OrchestratorLogSink,
} from "@agenttoruk/agent-engine";
import { prisma } from "@agenttoruk/database";
import { createToolRuntime } from "./tools";

export async function runAgentForMessage(input: {
  organizationId: string;
  conversationId: string;
  messages: ChatMessage[];
  userMessage: string;
  visitorEmail?: string;
  visitorName?: string;
}) {
  const config = await prisma.agentConfig.findUnique({
    where: { organizationId: input.organizationId },
  });

  const logSink: OrchestratorLogSink = {
    async log(stage, data, durationMs) {
      await prisma.agentLog.create({
        data: {
          organizationId: input.organizationId,
          conversationId: input.conversationId,
          stage,
          input: data.input as object | undefined,
          output: data.output as object | undefined,
          durationMs,
        },
      });
    },
  };

  const personality = config?.personality ??
    "You are a helpful, professional customer support agent.";

  const businessContext = config?.businessDescription
    ? `\n\nAbout the business: ${config.businessDescription}`
    : "";

  const orchestrator = new AgentOrchestrator({
    llmProvider: config?.llmProvider === "GEMINI" ? "gemini" : "openai",
    llmModel: config?.llmModel ?? "gpt-4o-mini",
    ragProvider:
      config?.ragProvider === "GEMINI_FILE_SEARCH"
        ? "gemini_file_search"
        : "pgvector",
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    systemPrompt: personality + businessContext,
    agentName: config?.name ?? "Support Agent",
    tone: config?.tone ?? "professional",
    fallbackMessage:
      config?.fallbackMessage ??
      "Thanks for your message. Our team will review it and get back to you soon.",
    confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    allowedActions: config?.allowedActions ?? [],
    restrictedActions: config?.restrictedActions ?? [],
    toolRuntime: createToolRuntime(),
    logSink,
  });

  return orchestrator.processMessage(
    {
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      messages: input.messages,
      visitorEmail: input.visitorEmail,
      visitorName: input.visitorName,
    },
    input.userMessage,
  );
}

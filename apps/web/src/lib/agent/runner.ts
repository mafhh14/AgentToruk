import type { ChatMessage } from "@agenttoruk/shared";
import {
  AgentOrchestrator,
  type OrchestratorLogSink,
} from "@agenttoruk/agent-engine";
import { prisma } from "@agenttoruk/database";
import { getIndustryPack } from "@agenttoruk/industry-packs";
import { createToolRuntime } from "./tools";

export async function runAgentForMessage(input: {
  organizationId: string;
  conversationId: string;
  messages: ChatMessage[];
  userMessage: string;
  visitorEmail?: string;
  visitorName?: string;
}) {
  const [config, org] = await Promise.all([
    prisma.agentConfig.findUnique({
      where: { organizationId: input.organizationId },
    }),
    prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { industryPackId: true },
    }),
  ]);

  const pack =
    getIndustryPack(org?.industryPackId ?? "general-support") ??
    getIndustryPack("general-support")!;

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

  const personality =
    config?.personality ?? pack.personality;

  const businessContext = config?.businessDescription
    ? `\n\nAbout the business: ${config.businessDescription}`
    : "";

  const allowedActions =
    config?.allowedActions?.length ? config.allowedActions : pack.allowedActions;

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
    tone: config?.tone ?? pack.tone,
    fallbackMessage:
      config?.fallbackMessage ??
      "Thanks for your message. Our team will review it and get back to you soon.",
    confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    allowedActions,
    restrictedActions: config?.restrictedActions ?? [],
    industryIntents: pack.intents,
    intentPromptAddon: pack.intentPromptAddon,
    industryPlan: {
      ticketIntents: pack.ticketIntents,
      lookupIntentTools: pack.lookupIntentTools,
    },
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

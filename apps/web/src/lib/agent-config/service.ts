import { prisma } from "@agenttoruk/database";
import type { RagProvider } from "@agenttoruk/database";

export interface AgentConfigView {
  name: string;
  llmProvider: string;
  llmModel: string;
  ragProvider: RagProvider;
  confidenceThreshold: number;
  tone: string | null;
  geminiFileSearchStoreId: string | null;
  geminiApiKeyConfigured: boolean;
}

export async function getAgentConfig(
  organizationId: string,
): Promise<AgentConfigView | null> {
  const config = await prisma.agentConfig.findUnique({
    where: { organizationId },
  });

  if (!config) return null;

  return {
    name: config.name,
    llmProvider: config.llmProvider,
    llmModel: config.llmModel,
    ragProvider: config.ragProvider,
    confidenceThreshold: config.confidenceThreshold,
    tone: config.tone,
    geminiFileSearchStoreId: config.geminiFileSearchStoreId,
    geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  };
}

export async function updateAgentConfig(
  organizationId: string,
  userId: string,
  input: { ragProvider?: RagProvider },
): Promise<AgentConfigView> {
  const existing = await prisma.agentConfig.findUnique({
    where: { organizationId },
  });

  if (!existing) {
    throw new Error("Agent config not found");
  }

  if (
    input.ragProvider === "GEMINI_FILE_SEARCH" &&
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error("GEMINI_API_KEY is required for Gemini File Search");
  }

  const updated = await prisma.agentConfig.update({
    where: { organizationId },
    data: {
      ragProvider: input.ragProvider,
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId: userId,
      action: "agent_config.updated",
      resource: "agent_config",
      resourceId: updated.id,
      metadata: {
        ragProvider: updated.ragProvider,
      },
    },
  });

  return (await getAgentConfig(organizationId))!;
}

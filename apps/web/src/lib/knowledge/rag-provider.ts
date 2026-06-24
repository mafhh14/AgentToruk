import { prisma } from "@agenttoruk/database";
import type { RagProviderName } from "@agenttoruk/shared";
import { createRagProvider } from "@agenttoruk/rag";
import type { RagProvider } from "@agenttoruk/rag";

export async function getRagProviderForOrganization(
  organizationId: string,
): Promise<RagProvider> {
  const config = await prisma.agentConfig.findUnique({
    where: { organizationId },
    select: { ragProvider: true },
  });

  const name: RagProviderName =
    config?.ragProvider === "GEMINI_FILE_SEARCH"
      ? "gemini_file_search"
      : "pgvector";

  return createRagProvider(name, {
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiSearchModel: process.env.GEMINI_RAG_MODEL ?? "gemini-2.0-flash",
    databaseUrl: process.env.DATABASE_URL,
  });
}

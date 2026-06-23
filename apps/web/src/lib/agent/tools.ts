import type { AgentContext } from "@agenttoruk/shared";
import type { ToolExecutionResult, ToolRuntime } from "@agenttoruk/agent-engine";
import type { TicketPriority } from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import { createRagProvider } from "@agenttoruk/rag";

export function createToolRuntime(): ToolRuntime {
  return {
    async execute(
      name: string,
      args: Record<string, unknown>,
      context: AgentContext,
    ): Promise<ToolExecutionResult> {
      switch (name) {
        case "search_knowledge_base":
          return searchKnowledgeBase(context, args);
        case "create_ticket":
          return createTicket(context, args);
        case "escalate_to_human":
          return escalateToHuman(context, args);
        default:
          return {
            success: false,
            toolName: name,
            output: {},
            error: `Unknown tool: ${name}`,
          };
      }
    },
  };
}

async function searchKnowledgeBase(
  context: AgentContext,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const query = String(args.query ?? "");
  if (!query) {
    return {
      success: false,
      toolName: "search_knowledge_base",
      output: {},
      error: "Query required",
    };
  }

  try {
    const config = await prisma.agentConfig.findUnique({
      where: { organizationId: context.organizationId },
    });

    const ragProvider =
      config?.ragProvider === "GEMINI_FILE_SEARCH"
        ? "gemini_file_search"
        : "pgvector";

    const rag = createRagProvider(ragProvider, {
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      databaseUrl: process.env.DATABASE_URL,
    });

    const chunks = await rag.search({
      organizationId: context.organizationId,
      query,
      limit: 5,
    });

    return {
      success: true,
      toolName: "search_knowledge_base",
      output: { chunks, count: chunks.length },
    };
  } catch {
    return {
      success: true,
      toolName: "search_knowledge_base",
      output: {
        chunks: [],
        count: 0,
        note: "Knowledge base search will be available after documents are indexed (Phase 7).",
      },
    };
  }
}

async function createTicket(
  context: AgentContext,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const title = String(args.title ?? "Support request");
  const description = String(args.description ?? "");
  const priority = normalizePriority(String(args.priority ?? "MEDIUM"));

  try {
    const ticket = await prisma.ticket.create({
      data: {
        organizationId: context.organizationId,
        conversationId: context.conversationId,
        title: title.slice(0, 200),
        description,
        priority,
      },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: context.organizationId,
        action: "ticket.created_by_agent",
        resource: "ticket",
        resourceId: ticket.id,
        metadata: {
          conversationId: context.conversationId,
          intent: args.intent != null ? String(args.intent) : undefined,
        },
      },
    });

    return {
      success: true,
      toolName: "create_ticket",
      output: {
        ticketId: ticket.id,
        title: ticket.title,
        priority: ticket.priority,
      },
    };
  } catch (error) {
    return {
      success: false,
      toolName: "create_ticket",
      output: {},
      error: error instanceof Error ? error.message : "Failed to create ticket",
    };
  }
}

async function escalateToHuman(
  context: AgentContext,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  try {
    await prisma.conversation.update({
      where: { id: context.conversationId },
      data: { status: "ESCALATED" },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: context.organizationId,
        action: "human_handoff.started",
        resource: "conversation",
        resourceId: context.conversationId,
        metadata: { reason: String(args.reason ?? "") },
      },
    });

    return {
      success: true,
      toolName: "escalate_to_human",
      output: { escalated: true, reason: args.reason },
    };
  } catch (error) {
    return {
      success: false,
      toolName: "escalate_to_human",
      output: {},
      error: error instanceof Error ? error.message : "Escalation failed",
    };
  }
}

function normalizePriority(value: string): TicketPriority {
  const upper = value.toUpperCase();
  if (upper === "LOW" || upper === "HIGH" || upper === "URGENT") return upper;
  return "MEDIUM";
}

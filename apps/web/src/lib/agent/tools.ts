import type { AgentContext } from "@agenttoruk/shared";
import type { ToolExecutionResult, ToolRuntime } from "@agenttoruk/agent-engine";
import type { TicketPriority } from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import { notifyEscalation } from "@/lib/conversations/handoff";
import { getRagProviderForOrganization } from "@/lib/knowledge/rag-provider";

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
        case "lookup_reservation":
          return lookupReservation(context, args);
        case "lookup_booking":
          return lookupBooking(context, args);
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
    const rag = await getRagProviderForOrganization(context.organizationId);

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
        note: "Knowledge base search is unavailable or returned no results.",
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

    await notifyEscalation(context.organizationId, context.conversationId);

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

async function lookupReservation(
  context: AgentContext,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const confirmation =
    String(args.confirmation_number ?? "").trim() ||
    extractReference(String(args.query ?? ""));

  const reservation = {
    confirmationNumber: confirmation || "HTL-48291",
    guestName: context.visitorName ?? "Guest",
    checkIn: "2026-07-10",
    checkOut: "2026-07-13",
    roomType: "Deluxe King",
    status: "confirmed",
    source: "mock-pms",
  };

  return {
    success: true,
    toolName: "lookup_reservation",
    output: {
      found: true,
      reservation,
      note: "Mock PMS data — connect a real PMS in integrations.",
    },
  };
}

async function lookupBooking(
  context: AgentContext,
  args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
  const reference =
    String(args.booking_reference ?? "").trim() ||
    extractReference(String(args.query ?? ""));

  const booking = {
    reference: reference || "TRV-918273",
    travelerEmail: context.visitorEmail ?? "traveler@example.com",
    segments: [
      {
        type: "flight",
        from: "JFK",
        to: "LHR",
        departure: "2026-08-15T18:30:00Z",
        status: "confirmed",
      },
    ],
    status: "confirmed",
    source: "mock-booking-api",
  };

  return {
    success: true,
    toolName: "lookup_booking",
    output: {
      found: true,
      booking,
      note: "Mock booking API — connect a real CRS in integrations.",
    },
  };
}

function extractReference(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{2,6}-?\d{4,8}|\d{6,12})\b/i);
  return match?.[1];
}

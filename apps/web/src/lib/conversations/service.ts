import type {
  ConversationStatus,
  MessageRole,
  Prisma,
} from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import type { ChatMessage } from "@agenttoruk/shared";
import { AgentEngine } from "@agenttoruk/agent-engine";

export function mapMessageRoleToChat(role: MessageRole): ChatMessage["role"] {
  switch (role) {
    case "USER":
      return "user";
    case "ASSISTANT":
      return "assistant";
    case "HUMAN":
      return "assistant";
    case "SYSTEM":
      return "system";
    default:
      return "user";
  }
}

export async function listConversations(
  organizationId: string,
  options: {
    status?: ConversationStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.ConversationWhereInput = {
    organizationId,
    ...(options.status ? { status: options.status } : {}),
    ...(options.search
      ? {
          OR: [
            { visitorName: { contains: options.search, mode: "insensitive" } },
            { visitorEmail: { contains: options.search, mode: "insensitive" } },
            { visitorId: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      visitorId: c.visitorId,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            role: c.messages[0].role,
            createdAt: c.messages[0].createdAt,
          }
        : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getConversation(organizationId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, organizationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      rating: true,
    },
  });
}

export async function createConversation(input: {
  organizationId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorId?: string;
  initialMessage?: string;
}) {
  const conversation = await prisma.conversation.create({
    data: {
      organizationId: input.organizationId,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      visitorId: input.visitorId,
    },
  });

  if (input.initialMessage?.trim()) {
    await processUserMessage({
      conversationId: conversation.id,
      organizationId: input.organizationId,
      content: input.initialMessage.trim(),
    });
  }

  return getConversation(input.organizationId, conversation.id);
}

export async function updateConversation(
  organizationId: string,
  id: string,
  data: {
    status?: ConversationStatus;
    summary?: string;
    assignedUserId?: string | null;
  },
) {
  const existing = await prisma.conversation.findFirst({
    where: { id, organizationId },
  });

  if (!existing) return null;

  return prisma.conversation.update({
    where: { id },
    data: {
      ...data,
      closedAt:
        data.status === "CLOSED" || data.status === "RESOLVED"
          ? new Date()
          : data.status
            ? null
            : undefined,
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function processUserMessage(input: {
  conversationId: string;
  organizationId: string;
  content: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.status === "CLOSED") {
    throw new Error("Conversation is closed");
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: input.content,
    },
  });

  let assistantContent: string;
  let confidence: number | undefined;
  let handoff = false;

  if (conversation.status === "ESCALATED") {
    assistantContent =
      "Your conversation has been escalated to our support team. A human agent will respond shortly.";
    confidence = 1;
  } else {
    const agentResult = await generateAgentResponse(
      conversation.organizationId,
      conversation.id,
      conversation.messages,
      input.content,
    );
    assistantContent = agentResult.response;
    confidence = agentResult.confidence;
    handoff = agentResult.handoff ?? false;

    if (handoff) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: "ESCALATED" },
      });
    }
  }

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: assistantContent,
      confidence,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return { userMessage, assistantMessage, handoff };
}

export async function addHumanMessage(input: {
  conversationId: string;
  organizationId: string;
  content: string;
  authorId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: "HUMAN",
      content: input.content,
      metadata: { authorId: input.authorId },
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: {
      status: conversation.status === "ESCALATED" ? "ESCALATED" : "ACTIVE",
      updatedAt: new Date(),
    },
  });

  return message;
}

async function generateAgentResponse(
  organizationId: string,
  conversationId: string,
  history: { role: MessageRole; content: string }[],
  userMessage: string,
) {
  const config = await prisma.agentConfig.findUnique({
    where: { organizationId },
  });

  const systemPrompt =
    config?.personality ??
    "You are a helpful customer support agent. Be concise and professional.";

  const businessContext = config?.businessDescription
    ? `\n\nBusiness context: ${config.businessDescription}`
    : "";

  const llmProvider =
    config?.llmProvider === "GEMINI" ? "gemini" : ("openai" as const);
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const hasApiKey =
    llmProvider === "openai" ? !!openaiApiKey : !!geminiApiKey;

  if (!hasApiKey) {
    return {
      response:
        config?.fallbackMessage ??
        "Thanks for your message. Our team will review it and get back to you soon.",
      confidence: 0.5,
      handoff: false,
    };
  }

  try {
    const engine = new AgentEngine({
      llmProvider,
      llmModel: config?.llmModel ?? "gpt-4o-mini",
      ragProvider:
        config?.ragProvider === "GEMINI_FILE_SEARCH"
          ? "gemini_file_search"
          : "pgvector",
      openaiApiKey,
      geminiApiKey,
      systemPrompt: systemPrompt + businessContext,
      confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    });

    const chatHistory: ChatMessage[] = history.map((m) => ({
      role: mapMessageRoleToChat(m.role),
      content: m.content,
    }));

    const result = await engine.processMessage(
      {
        organizationId,
        conversationId,
        messages: chatHistory,
      },
      userMessage,
    );

    await prisma.agentLog.create({
      data: {
        organizationId,
        conversationId,
        stage: "generate_response",
        output: {
          confidence: result.confidence,
          handoff: result.handoff,
        },
        confidence: result.confidence,
      },
    });

    return result;
  } catch (error) {
    console.error("[agent]", error);
    return {
      response:
        config?.fallbackMessage ??
        "I'm having trouble processing your request. Please try again or talk to a human agent.",
      confidence: 0.3,
      handoff: true,
    };
  }
}

export async function getConversationStats(organizationId: string) {
  const [total, active, escalated, today] = await Promise.all([
    prisma.conversation.count({ where: { organizationId } }),
    prisma.conversation.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.conversation.count({
      where: { organizationId, status: "ESCALATED" },
    }),
    prisma.conversation.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return { total, active, escalated, today };
}

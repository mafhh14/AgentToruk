import type {
  ConversationStatus,
  MessageRole,
  Prisma,
} from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import type { ChatMessage } from "@agenttoruk/shared";
import { runAgentForMessage } from "@/lib/agent/runner";
import { notifyEscalation } from "@/lib/conversations/handoff";
import { emitNewMessage } from "@/lib/realtime/emit";

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
      assignedUserId: c.assignedUserId,
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

  const updated = await prisma.conversation.update({
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

  if (data.status === "ESCALATED") {
    await notifyEscalation(organizationId, id);
  }

  return updated;
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

  await emitNewMessage(conversation.id, conversation.organizationId, {
    id: userMessage.id,
    role: userMessage.role,
    content: userMessage.content,
    createdAt: userMessage.createdAt,
  });

  if (conversation.status === "ESCALATED") {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage,
      assistantMessage: null,
      handoff: false,
      escalated: true,
    };
  }

  let handoff = false;
  let messageSources: Prisma.InputJsonValue | undefined;

  const agentResult = await generateAgentResponse(
    conversation.organizationId,
    conversation.id,
    conversation.messages,
    input.content,
    {
      visitorEmail: conversation.visitorEmail ?? undefined,
      visitorName: conversation.visitorName ?? undefined,
    },
  );
  const assistantContent = agentResult.response;
  const confidence = agentResult.confidence;
  handoff = agentResult.handoff ?? false;
  const messageMetadata = {
    intent: agentResult.intent,
    sentiment: agentResult.sentiment,
    urgency: agentResult.urgency,
    actionsTaken: agentResult.actionsTaken,
    handoffReason: agentResult.handoffReason,
  };
  if (agentResult.sources?.length) {
    messageSources = agentResult.sources.map((s) => ({
      documentName: s.documentName,
      content: s.content.slice(0, 200),
      score: s.score,
    }));
  }

  if (handoff) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "ESCALATED" },
    });
    await notifyEscalation(conversation.organizationId, conversation.id);
  }

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: assistantContent,
      confidence,
      sources: messageSources,
      metadata: messageMetadata as Prisma.InputJsonValue,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await emitNewMessage(conversation.id, conversation.organizationId, {
    id: assistantMessage.id,
    role: assistantMessage.role,
    content: assistantMessage.content,
    createdAt: assistantMessage.createdAt,
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

  const author = await prisma.user.findUnique({
    where: { id: input.authorId },
    select: { name: true, email: true },
  });

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

  await emitNewMessage(input.conversationId, input.organizationId, {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    authorName: author?.name ?? author?.email ?? "Support Agent",
  });

  return message;
}

async function generateAgentResponse(
  organizationId: string,
  conversationId: string,
  history: { role: MessageRole; content: string }[],
  userMessage: string,
  visitor?: { visitorEmail?: string; visitorName?: string },
) {
  const config = await prisma.agentConfig.findUnique({
    where: { organizationId },
  });

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const llmProvider =
    config?.llmProvider === "GEMINI" ? "gemini" : ("openai" as const);

  const hasApiKey =
    llmProvider === "openai" ? !!openaiApiKey : !!geminiApiKey;

  if (!hasApiKey) {
    return {
      response:
        config?.fallbackMessage ??
        "Thanks for your message. Our team will review it and get back to you soon.",
      confidence: 0.5,
      handoff: false,
      intent: "general",
      sentiment: "neutral",
      urgency: "low",
      actionsTaken: [] as string[],
    };
  }

  try {
    const chatHistory: ChatMessage[] = history.map((m) => ({
      role: mapMessageRoleToChat(m.role),
      content: m.content,
    }));

    return await runAgentForMessage({
      organizationId,
      conversationId,
      messages: chatHistory,
      userMessage,
      visitorEmail: visitor?.visitorEmail,
      visitorName: visitor?.visitorName,
    });
  } catch (error) {
    console.error("[agent]", error);
    return {
      response:
        config?.fallbackMessage ??
        "I'm having trouble processing your request. Please try again or talk to a human agent.",
      confidence: 0.3,
      handoff: true,
      handoffReason: "Agent processing error",
      intent: "general",
      sentiment: "neutral",
      urgency: "low",
      actionsTaken: [] as string[],
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

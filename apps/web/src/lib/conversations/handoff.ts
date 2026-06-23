import { prisma } from "@agenttoruk/database";
import {
  emitConversationClaimed,
  emitConversationEscalated,
} from "@/lib/realtime/emit";

export async function listHandoffQueue(organizationId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId,
      status: "ESCALATED",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  const assignees = await prisma.user.findMany({
    where: {
      id: {
        in: conversations
          .map((c) => c.assignedUserId)
          .filter((id): id is string => !!id),
      },
    },
    select: { id: true, name: true, email: true },
  });

  const assigneeMap = new Map(assignees.map((u) => [u.id, u]));

  return conversations.map((c) => ({
    id: c.id,
    status: c.status,
    visitorName: c.visitorName,
    visitorEmail: c.visitorEmail,
    visitorId: c.visitorId,
    assignedUserId: c.assignedUserId,
    assignee: c.assignedUserId
      ? assigneeMap.get(c.assignedUserId) ?? null
      : null,
    messageCount: c._count.messages,
    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content,
          role: c.messages[0].role,
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    waitingSince: c.updatedAt.toISOString(),
  }));
}

export async function claimConversation(
  organizationId: string,
  conversationId: string,
  userId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId, status: "ESCALATED" },
  });

  if (!conversation) return null;

  if (
    conversation.assignedUserId &&
    conversation.assignedUserId !== userId
  ) {
    throw new Error("Conversation is already assigned to another agent");
  }

  const assignee = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!assignee) {
    throw new Error("Agent not found");
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedUserId: userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId: userId,
      action: "human_handoff.claimed",
      resource: "conversation",
      resourceId: conversationId,
      metadata: { assigneeId: userId },
    },
  });

  await emitConversationClaimed(organizationId, conversationId, assignee);

  return updated;
}

export async function notifyEscalation(
  organizationId: string,
  conversationId: string,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId },
  });

  if (!conversation || conversation.status !== "ESCALATED") return;

  await emitConversationEscalated(organizationId, conversation);
}

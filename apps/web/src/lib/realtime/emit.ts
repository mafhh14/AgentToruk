import {
  REALTIME_EVENTS,
  conversationRoom,
  orgRoom,
} from "@agenttoruk/realtime/events";
import { createRealtimeToken } from "@agenttoruk/realtime/token";

function getSecret(): string {
  return (
    process.env.REALTIME_INTERNAL_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-realtime-secret"
  );
}

function getInternalUrl(): string {
  return process.env.REALTIME_INTERNAL_URL ?? "http://localhost:3001";
}

export function getPublicRealtimeUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001";
}

export function createAgentRealtimeToken(input: {
  organizationId: string;
  userId: string;
  userName?: string | null;
}): string {
  return createRealtimeToken(
    {
      type: "agent",
      organizationId: input.organizationId,
      userId: input.userId,
      userName: input.userName,
    },
    getSecret(),
  );
}

export function createVisitorRealtimeToken(input: {
  organizationId: string;
  conversationId: string;
  visitorId: string;
}): string {
  return createRealtimeToken(
    {
      type: "visitor",
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      visitorId: input.visitorId,
    },
    getSecret(),
  );
}

export async function emitRealtime(
  room: string,
  event: string,
  payload: unknown,
): Promise<void> {
  try {
    await fetch(`${getInternalUrl()}/internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getSecret()}`,
      },
      body: JSON.stringify({ room, event, payload }),
    });
  } catch (error) {
    console.error("[realtime emit]", error);
  }
}

export async function emitNewMessage(
  conversationId: string,
  organizationId: string,
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: Date | string;
    authorName?: string | null;
  },
): Promise<void> {
  const payload = {
    id: message.id,
    conversationId,
    role: message.role,
    content: message.content,
    createdAt:
      message.createdAt instanceof Date
        ? message.createdAt.toISOString()
        : message.createdAt,
    authorName: message.authorName ?? null,
  };

  await Promise.all([
    emitRealtime(conversationRoom(conversationId), REALTIME_EVENTS.MESSAGE_NEW, payload),
    emitRealtime(orgRoom(organizationId), REALTIME_EVENTS.MESSAGE_NEW, payload),
  ]);
}

export async function emitConversationEscalated(
  organizationId: string,
  conversation: {
    id: string;
    visitorName?: string | null;
    visitorEmail?: string | null;
    updatedAt: Date;
  },
): Promise<void> {
  const payload = {
    conversationId: conversation.id,
    organizationId,
    visitorName: conversation.visitorName ?? null,
    visitorEmail: conversation.visitorEmail ?? null,
    updatedAt: conversation.updatedAt.toISOString(),
  };

  await Promise.all([
    emitRealtime(orgRoom(organizationId), REALTIME_EVENTS.CONVERSATION_ESCALATED, payload),
    emitRealtime(orgRoom(organizationId), REALTIME_EVENTS.QUEUE_UPDATED, payload),
  ]);
}

export async function emitConversationClaimed(
  organizationId: string,
  conversationId: string,
  assignee: { id: string; name: string | null; email: string },
): Promise<void> {
  const payload = { conversationId, assignee };

  await Promise.all([
    emitRealtime(conversationRoom(conversationId), REALTIME_EVENTS.CONVERSATION_CLAIMED, payload),
    emitRealtime(orgRoom(organizationId), REALTIME_EVENTS.CONVERSATION_CLAIMED, payload),
    emitRealtime(orgRoom(organizationId), REALTIME_EVENTS.QUEUE_UPDATED, payload),
  ]);
}

export { REALTIME_EVENTS, conversationRoom, orgRoom };

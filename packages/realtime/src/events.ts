export const REALTIME_EVENTS = {
  MESSAGE_NEW: "message:new",
  TYPING: "typing",
  CONVERSATION_ESCALATED: "conversation:escalated",
  CONVERSATION_CLAIMED: "conversation:claimed",
  QUEUE_UPDATED: "queue:updated",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface RealtimeMessagePayload {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
  authorName?: string | null;
}

export interface RealtimeTypingPayload {
  conversationId: string;
  role: "agent" | "visitor";
  isTyping: boolean;
  userName?: string | null;
}

export interface RealtimeEscalatedPayload {
  conversationId: string;
  organizationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  updatedAt: string;
}

export interface RealtimeClaimedPayload {
  conversationId: string;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function orgRoom(organizationId: string): string {
  return `org:${organizationId}`;
}

export function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

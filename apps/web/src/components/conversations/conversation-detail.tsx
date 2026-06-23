"use client";

import type { ConversationStatus, MessageRole } from "@agenttoruk/database";
import { PageHeader } from "@/components/layout/page-header";
import {
  formatConversationStatus,
  formatMessageTime,
  roleLabel,
  statusBadgeClass,
} from "@/lib/conversations/format";
import { useRealtime } from "@/hooks/use-realtime";
import { hasPermission } from "@/lib/rbac";
import { Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  confidence?: number | null;
  sources?: Array<{ documentName: string; content: string; score: number }> | null;
  metadata?: {
    intent?: string;
    sentiment?: string;
    urgency?: string;
    actionsTaken?: string[];
    handoffReason?: string;
    authorId?: string;
  } | null;
}

interface ConversationDetail {
  id: string;
  status: ConversationStatus;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorId: string | null;
  assignedUserId: string | null;
  summary: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function ConversationDetailView({
  conversationId,
}: {
  conversationId: string;
}) {
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageIdsRef = useRef(new Set<string>());

  const canWrite =
    session?.user?.role &&
    hasPermission(session.user.role, "conversations:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = (await res.json()) as { conversation: ConversationDetail };
        setConversation(data.conversation);
        messageIdsRef.current = new Set(
          data.conversation.messages.map((m) => m.id),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const { emitTyping } = useRealtime({
    enabled: !!conversation && conversation.status !== "CLOSED",
    onMessage: (msg) => {
      if (msg.conversationId !== conversationId) return;
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);

      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: msg.id,
              role: msg.role as MessageRole,
              content: msg.content,
              createdAt: msg.createdAt,
            },
          ],
        };
      });
    },
    onTyping: (payload) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.role !== "visitor") return;
      setVisitorTyping(payload.isTyping);
    },
    onClaimed: load,
  });

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  function handleReplyChange(value: string) {
    setReply(value);
    emitTyping(conversationId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(conversationId, false);
    }, 1500);
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    emitTyping(conversationId, false);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: reply }),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as { message: Message };
        messageIdsRef.current.add(data.message.id);
        setReply("");
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          };
        });
      }
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: ConversationStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setUpdating(false);
    }
  }

  async function claimConversation() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/claim`, {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-12 text-center">
        <p className="text-[var(--muted)]">Conversation not found.</p>
        <Link
          href="/dashboard/conversations"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to conversations
        </Link>
      </div>
    );
  }

  const isEscalated = conversation.status === "ESCALATED";
  const isAssignedToMe =
    conversation.assignedUserId === session?.user?.id;
  const needsClaim = isEscalated && !conversation.assignedUserId;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/dashboard/conversations"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to conversations
        </Link>
      </div>

      <PageHeader
        title={conversation.visitorName ?? conversation.visitorEmail ?? "Anonymous visitor"}
        description={
          conversation.visitorEmail && conversation.visitorName
            ? conversation.visitorEmail
            : conversation.visitorId
              ? `Visitor ID: ${conversation.visitorId}`
              : undefined
        }
        action={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              {needsClaim && (
                <button
                  type="button"
                  disabled={claiming}
                  onClick={claimConversation}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {claiming ? "Claiming..." : "Take over chat"}
                </button>
              )}
              {conversation.status !== "ESCALATED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus("ESCALATED")}
                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                >
                  Escalate
                </button>
              )}
              {conversation.status !== "RESOLVED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus("RESOLVED")}
                  className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                >
                  Resolve
                </button>
              )}
              {conversation.status !== "CLOSED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus("CLOSED")}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(conversation.status)}`}
        >
          {formatConversationStatus(conversation.status)}
        </span>
        {isEscalated && isAssignedToMe && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            Assigned to you — live chat active
          </span>
        )}
        {isEscalated && conversation.assignedUserId && !isAssignedToMe && (
          <span className="text-xs text-[var(--muted)]">
            Assigned to another agent
          </span>
        )}
        <span className="text-xs text-[var(--muted)]">
          Started {formatMessageTime(conversation.createdAt)}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex max-h-[480px] flex-col gap-4 overflow-y-auto p-6">
          {conversation.messages.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted)]">
              No messages in this conversation.
            </p>
          ) : (
            conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "USER" ? "items-end" : "items-start"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{roleLabel(msg.role)}</span>
                  <span>{formatMessageTime(msg.createdAt)}</span>
                  {msg.confidence != null && msg.role === "ASSISTANT" && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 dark:bg-slate-700">
                      {Math.round(msg.confidence * 100)}% confidence
                    </span>
                  )}
                  {msg.metadata?.intent && msg.role === "ASSISTANT" && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {msg.metadata.intent}
                    </span>
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === "USER"
                      ? "bg-blue-600 text-white"
                      : msg.role === "HUMAN"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                        : msg.role === "SYSTEM"
                          ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.metadata?.actionsTaken && msg.metadata.actionsTaken.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Actions: {msg.metadata.actionsTaken.join(", ")}
                  </p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 max-w-[80%] rounded-lg border border-[var(--border)] p-2 text-xs text-[var(--muted)]">
                    <p className="font-medium text-[var(--foreground)]">Sources</p>
                    {msg.sources.map((s, i) => (
                      <p key={i} className="mt-1">
                        [{i + 1}] {s.documentName}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {visitorTyping && (
            <p className="text-xs text-[var(--muted)]">Visitor is typing...</p>
          )}
        </div>

        {canWrite && conversation.status !== "CLOSED" && (
          <form
            onSubmit={handleReply}
            className="flex gap-2 border-t border-[var(--border)] p-4"
          >
            <input
              type="text"
              value={reply}
              onChange={(e) => handleReplyChange(e.target.value)}
              placeholder={
                isEscalated
                  ? "Reply as human agent (live)..."
                  : "Reply as support agent..."
              }
              className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

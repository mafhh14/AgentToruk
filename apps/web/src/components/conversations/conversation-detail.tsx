"use client";

import type { ConversationStatus, MessageRole } from "@agenttoruk/database";
import { PageHeader } from "@/components/layout/page-header";
import {
  formatConversationStatus,
  formatMessageTime,
  roleLabel,
  statusBadgeClass,
} from "@/lib/conversations/format";
import { hasPermission } from "@/lib/rbac";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  confidence?: number | null;
}

interface ConversationDetail {
  id: string;
  status: ConversationStatus;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorId: string | null;
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
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
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
        setReply("");
        await load();
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

      <div className="mb-4">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(conversation.status)}`}
        >
          {formatConversationStatus(conversation.status)}
        </span>
        <span className="ml-3 text-xs text-[var(--muted)]">
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
                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{roleLabel(msg.role)}</span>
                  <span>{formatMessageTime(msg.createdAt)}</span>
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === "USER"
                      ? "bg-blue-600 text-white"
                      : msg.role === "HUMAN"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
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
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply as support agent..."
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

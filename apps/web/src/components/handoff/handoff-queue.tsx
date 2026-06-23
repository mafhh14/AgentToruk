"use client";

import {
  formatConversationStatus,
  formatMessageTime,
  statusBadgeClass,
} from "@/lib/conversations/format";
import { useRealtime } from "@/hooks/use-realtime";
import { hasPermission } from "@/lib/rbac";
import { Headphones, Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface QueueItem {
  id: string;
  status: string;
  visitorName: string | null;
  visitorEmail: string | null;
  assignedUserId: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  lastMessage: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
  waitingSince: string;
}

export function HandoffQueue() {
  const { data: session } = useSession();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const canWrite =
    session?.user?.role &&
    hasPermission(session.user.role, "conversations:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations/queue");
      if (res.ok) {
        const data = (await res.json()) as { queue: QueueItem[] };
        setQueue(data.queue);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime({
    onQueueUpdated: load,
    onEscalated: load,
  });

  async function claim(conversationId: string) {
    setClaimingId(conversationId);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/claim`, {
        method: "POST",
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setClaimingId(null);
    }
  }

  const unassigned = queue.filter((q) => !q.assignedUserId);
  const mine = queue.filter((q) => q.assignedUserId === session?.user?.id);
  const others = queue.filter(
    (q) => q.assignedUserId && q.assignedUserId !== session?.user?.id,
  );

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Headphones className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-3 text-sm text-[var(--muted)]">
            No escalated conversations in the queue. Customers can request a
            human from the chat widget or the AI will escalate when needed.
          </p>
        </div>
      ) : (
        <>
          {unassigned.length > 0 && (
            <QueueSection
              title="Waiting for agent"
              description={`${unassigned.length} conversation${unassigned.length === 1 ? "" : "s"} need attention`}
              items={unassigned}
              canWrite={!!canWrite}
              claimingId={claimingId}
              onClaim={claim}
              showClaim
            />
          )}
          {mine.length > 0 && (
            <QueueSection
              title="Assigned to you"
              items={mine}
              canWrite={!!canWrite}
              claimingId={claimingId}
              onClaim={claim}
            />
          )}
          {others.length > 0 && (
            <QueueSection
              title="Assigned to teammates"
              items={others}
              canWrite={false}
              claimingId={claimingId}
              onClaim={claim}
            />
          )}
        </>
      )}
    </div>
  );
}

function QueueSection({
  title,
  description,
  items,
  canWrite,
  claimingId,
  onClaim,
  showClaim = false,
}: {
  title: string;
  description?: string;
  items: QueueItem[];
  canWrite: boolean;
  claimingId: string | null;
  onClaim: (id: string) => void;
  showClaim?: boolean;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--muted)]">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="px-6 py-3 font-medium">Visitor</th>
              <th className="px-6 py-3 font-medium">Last message</th>
              <th className="px-6 py-3 font-medium">Waiting</th>
              <th className="px-6 py-3 font-medium">Assignee</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/conversations/${item.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {item.visitorName ?? item.visitorEmail ?? "Anonymous"}
                  </Link>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusBadgeClass("ESCALATED")}`}
                  >
                    {formatConversationStatus("ESCALATED")}
                  </span>
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-[var(--muted)]">
                  {item.lastMessage?.content ?? "—"}
                </td>
                <td className="px-6 py-4 text-[var(--muted)]">
                  {formatMessageTime(item.waitingSince)}
                </td>
                <td className="px-6 py-4 text-[var(--muted)]">
                  {item.assignee?.name ?? item.assignee?.email ?? "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {showClaim && canWrite && (
                    <button
                      type="button"
                      disabled={claimingId === item.id}
                      onClick={() => onClaim(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {claimingId === item.id ? "Claiming..." : "Take over"}
                    </button>
                  )}
                  {!showClaim && (
                    <Link
                      href={`/dashboard/conversations/${item.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open chat →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

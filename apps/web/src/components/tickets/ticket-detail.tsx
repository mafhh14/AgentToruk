"use client";

import type { TicketPriority, TicketStatus } from "@agenttoruk/database";
import { PageHeader } from "@/components/layout/page-header";
import {
  formatTicketPriority,
  formatTicketStatus,
  formatTicketTime,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/tickets/format";
import { hasPermission } from "@/lib/rbac";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface TeamMember {
  user: { id: string; name: string | null; email: string };
}

interface TicketNote {
  id: string;
  content: string;
  isInternal: boolean;
  author: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: { id: string; name: string | null; email: string } | null;
  conversation: {
    id: string;
    visitorName: string | null;
    visitorEmail: string | null;
    status: string;
  } | null;
  notes: TicketNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canWrite =
    session?.user?.role && hasPermission(session.user.role, "tickets:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketRes, teamRes] = await Promise.all([
        fetch(`/api/tickets/${ticketId}`),
        fetch("/api/team"),
      ]);
      if (ticketRes.ok) {
        const data = (await ticketRes.json()) as { ticket: TicketDetail };
        setTicket(data.ticket);
      }
      if (teamRes.ok) {
        const data = (await teamRes.json()) as { members: TeamMember[] };
        setTeam(data.members);
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchTicket(updates: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) await load();
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note, isInternal: true }),
      });
      if (res.ok) {
        setNote("");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center text-sm text-[var(--muted)]">
        Ticket not found.
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/tickets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <PageHeader
        title={ticket.title}
        description={`Created ${formatTicketTime(ticket.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {ticket.description && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
                Description
              </h3>
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 text-sm font-medium">Notes</h3>
            {ticket.notes.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-[var(--border)] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>
                        {n.author?.name ?? n.author?.email ?? "System"}
                        {n.isInternal && (
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                            Internal
                          </span>
                        )}
                      </span>
                      <span>{formatTicketTime(n.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                  </div>
                ))}
              </div>
            )}

            {canWrite && (
              <form onSubmit={handleAddNote} className="mt-4 space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note..."
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={saving || !note.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add note"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 text-sm font-medium">Details</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Status</dt>
                <dd className="mt-1">
                  {canWrite ? (
                    <select
                      value={ticket.status}
                      disabled={updating}
                      onChange={(e) =>
                        patchTicket({ status: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {formatTicketStatus(s)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(ticket.status)}`}
                    >
                      {formatTicketStatus(ticket.status)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Priority</dt>
                <dd className="mt-1">
                  {canWrite ? (
                    <select
                      value={ticket.priority}
                      disabled={updating}
                      onChange={(e) =>
                        patchTicket({ priority: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {formatTicketPriority(p)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${priorityBadgeClass(ticket.priority)}`}
                    >
                      {formatTicketPriority(ticket.priority)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Assignee</dt>
                <dd className="mt-1">
                  {canWrite ? (
                    <select
                      value={ticket.assignee?.id ?? ""}
                      disabled={updating}
                      onChange={(e) =>
                        patchTicket({
                          assigneeId: e.target.value || null,
                        })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {team.map((m) => (
                        <option key={m.user.id} value={m.user.id}>
                          {m.user.name ?? m.user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>
                      {ticket.assignee?.name ??
                        ticket.assignee?.email ??
                        "Unassigned"}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Last updated</dt>
                <dd className="mt-1">{formatTicketTime(ticket.updatedAt)}</dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-[var(--muted)]">Resolved</dt>
                  <dd className="mt-1">{formatTicketTime(ticket.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {ticket.conversation && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h3 className="mb-2 text-sm font-medium">Linked conversation</h3>
              <Link
                href={`/dashboard/conversations/${ticket.conversation.id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <MessageSquare className="h-4 w-4" />
                {ticket.conversation.visitorName ??
                  ticket.conversation.visitorEmail ??
                  "Anonymous"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { TicketPriority, TicketStatus } from "@agenttoruk/database";
import {
  formatTicketPriority,
  formatTicketStatus,
  formatTicketTime,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/tickets/format";
import { hasPermission } from "@/lib/rbac";
import { Loader2, Plus, Search, Ticket } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface TicketItem {
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
  } | null;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS: Array<TicketStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function NewTicketModal({ open, onClose, onCreated }: NewTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        onCreated();
        onClose();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to create ticket");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold">New ticket</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="Brief summary of the issue"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="Additional details..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TicketsList() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showNew, setShowNew] = useState(false);

  const canWrite =
    session?.user?.role && hasPermission(session.user.role, "tickets:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/tickets?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { tickets: TicketItem[] };
        setTickets(data.tickets);
      }
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Search tickets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-10 pr-3 text-sm outline-none ring-blue-600 focus:ring-2"
          />
        </form>
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New ticket
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === s
                ? "bg-blue-600 text-white"
                : "border border-[var(--border)] text-[var(--muted)] hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {s === "ALL" ? "All" : formatTicketStatus(s)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              No tickets yet. Create one manually or let the AI agent create
              tickets from chat escalations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Assignee</th>
                <th className="px-6 py-3 font-medium">Notes</th>
                <th className="px-6 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/tickets/${t.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {t.title}
                    </Link>
                    {t.conversation && (
                      <p className="text-xs text-[var(--muted)]">
                        From chat:{" "}
                        {t.conversation.visitorName ??
                          t.conversation.visitorEmail ??
                          "Anonymous"}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(t.status)}`}
                    >
                      {formatTicketStatus(t.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${priorityBadgeClass(t.priority)}`}
                    >
                      {formatTicketPriority(t.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {t.assignee?.name ?? t.assignee?.email ?? "Unassigned"}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {t.noteCount}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {formatTicketTime(t.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewTicketModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={load}
      />
    </div>
  );
}

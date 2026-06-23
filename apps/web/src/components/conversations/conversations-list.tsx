"use client";

import type { ConversationStatus } from "@agenttoruk/database";
import {
  formatConversationStatus,
  formatMessageTime,
  statusBadgeClass,
} from "@/lib/conversations/format";
import { Loader2, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ConversationItem {
  id: string;
  status: ConversationStatus;
  visitorName: string | null;
  visitorEmail: string | null;
  messageCount: number;
  lastMessage: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS: Array<ConversationStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
];

export function ConversationsList() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConversationStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/conversations?${params}`);
      if (res.ok) {
        const data = (await res.json()) as {
          conversations: ConversationItem[];
        };
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
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
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-10 pr-3 text-sm outline-none ring-blue-600 focus:ring-2"
          />
        </form>
        <div className="flex flex-wrap gap-2">
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
              {s === "ALL" ? "All" : formatConversationStatus(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              No conversations yet. Embed the chat widget on your site to start
              receiving messages.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-6 py-3 font-medium">Visitor</th>
                <th className="px-6 py-3 font-medium">Last message</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Messages</th>
                <th className="px-6 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/conversations/${c.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {c.visitorName ?? c.visitorEmail ?? "Anonymous"}
                    </Link>
                    {c.visitorEmail && c.visitorName && (
                      <p className="text-xs text-[var(--muted)]">
                        {c.visitorEmail}
                      </p>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-[var(--muted)]">
                    {c.lastMessage?.content ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(c.status)}`}
                    >
                      {formatConversationStatus(c.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {c.messageCount}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {formatMessageTime(c.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

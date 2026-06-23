import { PageHeader } from "@/components/layout/page-header";
import {
  formatConversationStatus,
  statusBadgeClass,
} from "@/lib/conversations/format";
import {
  getConversationStats,
  listConversations,
} from "@/lib/conversations/service";
import { getSession } from "@/lib/session";
import {
  ArrowUpRight,
  Bot,
  MessageSquare,
  Star,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.organizationId) redirect("/login");

  const orgId = session.user.organizationId;
  const [stats, recent] = await Promise.all([
    getConversationStats(orgId),
    listConversations(orgId, { limit: 5 }),
  ]);

  const statCards = [
    {
      label: "Conversations today",
      value: String(stats.today),
      icon: MessageSquare,
      change: `${stats.total} total`,
    },
    {
      label: "Active chats",
      value: String(stats.active),
      icon: Bot,
      change: `${stats.escalated} escalated`,
    },
    {
      label: "Open tickets",
      value: "0",
      icon: Ticket,
      change: "Phase 9",
    },
    {
      label: "CSAT score",
      value: "—",
      icon: Star,
      change: "Phase 13",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your AI support agent performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">{stat.label}</span>
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent conversations</h2>
            <Link href="/dashboard/conversations">
              <ArrowUpRight className="h-4 w-4 text-[var(--muted)] hover:text-blue-600" />
            </Link>
          </div>
          {recent.conversations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No conversations yet. Embed the chat widget on your site or use{" "}
              <Link href="/widget-demo" className="text-blue-600 hover:underline">
                widget demo
              </Link>{" "}
              to test.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {c.visitorName ?? c.visitorEmail ?? "Anonymous"}
                      </p>
                      <p className="max-w-xs truncate text-xs text-[var(--muted)]">
                        {c.lastMessage?.content ?? "No messages"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(c.status)}`}
                    >
                      {formatConversationStatus(c.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Quick links</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/dashboard/settings"
                className="text-blue-600 hover:underline"
              >
                Get widget embed code →
              </Link>
            </li>
            <li>
              <Link
                href="/widget-demo"
                className="text-blue-600 hover:underline"
              >
                Test chat widget locally →
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/agent"
                className="text-blue-600 hover:underline"
              >
                Configure AI agent →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

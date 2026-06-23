import { PageHeader } from "@/components/layout/page-header";
import {
  ArrowUpRight,
  Bot,
  MessageSquare,
  Star,
  Ticket,
  Users,
} from "lucide-react";

const stats = [
  { label: "Conversations", value: "0", icon: MessageSquare, change: "—" },
  { label: "Open tickets", value: "0", icon: Ticket, change: "—" },
  { label: "AI resolution rate", value: "—", icon: Bot, change: "—" },
  { label: "CSAT score", value: "—", icon: Star, change: "—" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your AI support agent performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
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
            <ArrowUpRight className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            No conversations yet. Embed the chat widget on your site to get
            started.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent tickets</h2>
            <Users className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Tickets will appear here when the AI escalates or creates support
            cases.
          </p>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
        <h2 className="font-semibold text-blue-900 dark:text-blue-200">
          Getting started
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-blue-800 dark:text-blue-300">
          <li>Configure your agent personality and tone</li>
          <li>Upload knowledge base documents</li>
          <li>Copy the widget embed code from Settings</li>
          <li>Monitor conversations and tickets from this dashboard</li>
        </ol>
      </section>
    </div>
  );
}

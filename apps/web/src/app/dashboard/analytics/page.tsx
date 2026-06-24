import { PageHeader } from "@/components/layout/page-header";
import { getAnalyticsSummary } from "@/lib/analytics/service";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session?.user?.organizationId) redirect("/login");

  const stats = await getAnalyticsSummary(session.user.organizationId);

  const cards = [
    {
      label: "AI resolution rate",
      value: stats.aiResolutionRate != null ? `${stats.aiResolutionRate}%` : "—",
      hint: "Conversations not escalated to human",
    },
    {
      label: "CSAT average",
      value: stats.csatAvg != null ? stats.csatAvg.toFixed(1) : "—",
      hint: `${stats.csatCount} ratings`,
    },
    {
      label: "Escalated chats",
      value: String(stats.escalatedConversations),
      hint: `${stats.totalConversations} total conversations`,
    },
    {
      label: "Open tickets",
      value: String(stats.ticketsOpen),
      hint: `${stats.ticketsResolved} resolved`,
    },
    {
      label: "Indexed knowledge docs",
      value: String(stats.indexedDocs),
      hint: "Available for RAG search",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="AI resolution rate, knowledge coverage, and customer satisfaction."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

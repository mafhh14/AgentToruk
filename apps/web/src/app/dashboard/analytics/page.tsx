import { PageHeader } from "@/components/layout/page-header";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="AI resolution rate, knowledge gaps, and customer satisfaction."
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        Analytics dashboard coming in Phase 13.
      </div>
    </div>
  );
}

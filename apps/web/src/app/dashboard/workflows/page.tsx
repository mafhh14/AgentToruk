import { PageHeader } from "@/components/layout/page-header";

export default function WorkflowsPage() {
  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Automate actions based on intent, sentiment, and confidence."
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        Workflow automation coming in Phase 16.
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";

export default function ConversationsPage() {
  return (
    <div>
      <PageHeader
        title="Conversations"
        description="View and manage all customer chat sessions."
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        No conversations yet. Coming in Phase 5.
      </div>
    </div>
  );
}

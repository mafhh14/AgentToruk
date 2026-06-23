import { PageHeader } from "@/components/layout/page-header";

const statuses = [
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

export default function TicketsPage() {
  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Track support issues created from chat escalations."
        action={
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            New ticket
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <span
            key={s}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        No tickets yet. Coming in Phase 9.
      </div>
    </div>
  );
}

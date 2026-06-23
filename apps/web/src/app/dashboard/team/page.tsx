import { PageHeader } from "@/components/layout/page-header";

const roles = ["Owner", "Admin", "Support Agent", "Viewer"];

export default function TeamPage() {
  return (
    <div>
      <PageHeader
        title="Team"
        description="Invite members and manage roles and permissions."
        action={
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Invite member
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
          >
            {role}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        Team management coming in Phase 2.
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { listWorkflowRules } from "@/lib/workflows/service";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function WorkflowsPage() {
  const session = await getSession();
  if (!session?.user?.organizationId) redirect("/login");

  const rules = await listWorkflowRules(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Automation rules seeded from your industry pack. Full editor coming soon."
      />
      {rules.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
          No workflow rules yet. Apply an industry pack from{" "}
          <a href="/dashboard/industry" className="text-blue-600 hover:underline">
            Industry
          </a>{" "}
          to seed templates.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold">{rule.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    rule.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {rule.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {rule.description && (
                <p className="mt-2 text-sm text-[var(--muted)]">{rule.description}</p>
              )}
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-[var(--muted)]">Trigger</dt>
                  <dd className="font-mono">{rule.trigger}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Priority</dt>
                  <dd>{rule.priority}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Action</dt>
                  <dd className="font-mono">
                    {String((rule.actions as { type?: string })?.type ?? "—")}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

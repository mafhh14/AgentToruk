import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const orgId = session.user.organizationId;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="API keys, webhooks, integrations, and widget embed code."
      />
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Organization</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Name</dt>
              <dd className="font-medium">{session.user.organizationName}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Organization ID</dt>
              <dd className="font-mono text-xs">{orgId}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Slug</dt>
              <dd className="font-mono text-xs">{session.user.organizationSlug}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Widget</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Customize colors, welcome message, and layout in the{" "}
            <a href="/dashboard/widget" className="text-blue-600 hover:underline">
              widget theme editor
            </a>
            .
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Widget embed code</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add this script to your website to enable the chat widget.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`<script
  src="${appUrl}/widget.js"
  data-org="${orgId}"
  data-api-url="${appUrl}"
  async
></script>`}
          </pre>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">API keys</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Developer API coming in Phase 14.
          </p>
        </section>
      </div>
    </div>
  );
}

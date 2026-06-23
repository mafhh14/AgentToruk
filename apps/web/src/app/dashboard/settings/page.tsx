import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="API keys, webhooks, integrations, and widget embed code."
      />
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Widget embed code</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add this script to your website to enable the chat widget.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`<script
  src="https://cdn.agenttoruk.com/widget.js"
  data-org="org_your_id"
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

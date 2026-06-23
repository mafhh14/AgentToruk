import { PageHeader } from "@/components/layout/page-header";

export default function AgentPage() {
  return (
    <div>
      <PageHeader
        title="Agent configuration"
        description="Control AI personality, model, escalation rules, and widget appearance."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Agent settings</h2>
          <div className="mt-4 space-y-4">
            {[
              ["Agent name", "Support Agent"],
              ["LLM provider", "OpenAI"],
              ["Model", "gpt-4o-mini"],
              ["RAG provider", "pgvector"],
              ["Confidence threshold", "0.7"],
            ].map(([label, value]) => (
              <div key={label}>
                <label className="text-xs text-[var(--muted)]">{label}</label>
                <input
                  defaultValue={value}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                  readOnly
                />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Widget appearance</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Customize colors, fonts, and light/dark mode for the embeddable chat
            widget. Coming in Phase 11.
          </p>
          <div className="mt-4 h-48 rounded-lg border border-dashed border-[var(--border)] bg-slate-50 dark:bg-slate-900" />
        </section>
      </div>
    </div>
  );
}

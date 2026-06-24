import { PageHeader } from "@/components/layout/page-header";
import { AgentRagSettings } from "@/components/agent/agent-rag-settings";
import { getSession } from "@/lib/session";
import { prisma } from "@agenttoruk/database";
import { redirect } from "next/navigation";

const PIPELINE_STAGES = [
  { stage: "guardrails_input", desc: "Block abusive content, flag sensitive data" },
  { stage: "understand", desc: "Classify intent, sentiment, urgency, risk" },
  { stage: "plan", desc: "Select tools: KB search, ticket, escalate" },
  { stage: "generate", desc: "Produce grounded response with citations" },
];

const AVAILABLE_TOOLS = [
  "search_knowledge_base",
  "create_ticket",
  "escalate_to_human",
];

export default async function AgentPage() {
  const session = await getSession();
  if (!session?.user?.organizationId) redirect("/login");

  const config = await prisma.agentConfig.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  const recentLogs = await prisma.agentLog.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      stage: true,
      confidence: true,
      durationMs: true,
      createdAt: true,
      conversationId: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Agent configuration"
        description="Control AI personality, model, tools, and escalation behavior."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Agent settings</h2>
          <div className="mt-4 space-y-4">
            {[
              ["Agent name", config?.name ?? "Support Agent"],
              ["LLM provider", config?.llmProvider ?? "OPENAI"],
              ["Model", config?.llmModel ?? "gpt-4o-mini"],
              ["Confidence threshold", String(config?.confidenceThreshold ?? 0.7)],
              ["Tone", config?.tone ?? "professional"],
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
          <AgentRagSettings
            initialRagProvider={config?.ragProvider ?? "PGVECTOR"}
            initialStoreId={config?.geminiFileSearchStoreId ?? null}
            geminiApiKeyConfigured={Boolean(process.env.GEMINI_API_KEY)}
          />
          <p className="mt-4 text-xs text-[var(--muted)]">
            Other agent settings remain read-only for now. Configure LLM model via
            database or seed.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Agent pipeline (Phase 6)</h2>
          <ol className="mt-4 space-y-3">
            {PIPELINE_STAGES.map((item, i) => (
              <li key={item.stage} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{item.stage}</p>
                  <p className="text-[var(--muted)]">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <h3 className="mt-6 text-sm font-semibold">Available tools</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVAILABLE_TOOLS.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[var(--border)] px-2 py-1 font-mono text-xs"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-semibold">Recent agent logs</h2>
        {recentLogs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            No agent activity yet. Send a message via the widget to see pipeline
            logs.
          </p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 font-medium">Stage</th>
                <th className="py-2 font-medium">Confidence</th>
                <th className="py-2 font-medium">Duration</th>
                <th className="py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={`${log.stage}-${log.createdAt}`} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 font-mono text-xs">{log.stage}</td>
                  <td className="py-2">
                    {log.confidence != null
                      ? `${Math.round(log.confidence * 100)}%`
                      : "—"}
                  </td>
                  <td className="py-2">
                    {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                  </td>
                  <td className="py-2 text-[var(--muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

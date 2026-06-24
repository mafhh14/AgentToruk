"use client";

import { Building2, Loader2, Plane, Hotel, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface PackSummary {
  id: string;
  industry: string;
  name: string;
  description: string;
  suggestedQuestions: string[];
  connectors: string[];
}

interface IndustryState {
  industry: string;
  industryPackId: string;
  packName: string;
}

const INDUSTRY_ICONS: Record<string, typeof Building2> = {
  general: Building2,
  hospitality: Hotel,
  travel: Plane,
  ecommerce: Sparkles,
  saas: Building2,
};

export function IndustryPackSelector({
  canWrite,
}: {
  canWrite: boolean;
}) {
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [current, setCurrent] = useState<IndustryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/industry");
    if (res.ok) {
      const data = (await res.json()) as {
        packs: PackSummary[];
        current: IndustryState | null;
      };
      setPacks(data.packs);
      setCurrent(data.current);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyPack(packId: string) {
    if (!canWrite) return;
    setApplying(packId);
    setError("");
    setMessage("");

    const res = await fetch("/api/industry", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId, seedKnowledge: true }),
    });

    const data = (await res.json()) as { error?: string; pack?: { name: string } };
    setApplying(null);

    if (!res.ok) {
      setError(data.error ?? "Failed to apply pack");
      return;
    }

    setMessage(`Applied ${data.pack?.name ?? "industry pack"}. Agent, widget, and starter KB updated.`);
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading industry packs…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {current && (
        <p className="text-sm text-[var(--muted)]">
          Current pack: <span className="font-medium text-[var(--foreground)]">{current.packName}</span>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packs.map((pack) => {
          const Icon = INDUSTRY_ICONS[pack.industry] ?? Building2;
          const isActive = current?.industryPackId === pack.id;
          return (
            <div
              key={pack.id}
              className={`rounded-xl border p-5 ${
                isActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{pack.name}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{pack.description}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-1 text-xs text-[var(--muted)]">
                {pack.suggestedQuestions.slice(0, 2).map((q) => (
                  <li key={q}>• {q}</li>
                ))}
              </ul>

              {pack.connectors.length > 0 && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Connectors: {pack.connectors.join(", ")}
                </p>
              )}

              {canWrite && (
                <button
                  type="button"
                  disabled={isActive || applying === pack.id}
                  onClick={() => applyPack(pack.id)}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {applying === pack.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying…
                    </span>
                  ) : isActive ? (
                    "Active"
                  ) : (
                    "Use this pack"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
    </div>
  );
}

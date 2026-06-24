"use client";

import { ragProviderLabel } from "@/lib/knowledge/rag-labels";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AgentConfigState {
  ragProvider: "PGVECTOR" | "GEMINI_FILE_SEARCH";
  geminiFileSearchStoreId: string | null;
  geminiApiKeyConfigured: boolean;
}

export function AgentRagSettings({
  initialRagProvider,
  initialStoreId,
  geminiApiKeyConfigured,
}: {
  initialRagProvider: "PGVECTOR" | "GEMINI_FILE_SEARCH";
  initialStoreId: string | null;
  geminiApiKeyConfigured: boolean;
}) {
  const [config, setConfig] = useState<AgentConfigState>({
    ragProvider: initialRagProvider,
    geminiFileSearchStoreId: initialStoreId,
    geminiApiKeyConfigured,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/agent-config");
    if (!res.ok) return;
    const data = (await res.json()) as { config: AgentConfigState | null };
    if (data.config) {
      setConfig(data.config);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const ragProvider = form.get("ragProvider") as AgentConfigState["ragProvider"];

    const res = await fetch("/api/agent-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ragProvider }),
    });

    const data = (await res.json()) as {
      config?: AgentConfigState;
      error?: string;
    };

    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }

    if (data.config) {
      setConfig(data.config);
    }
    setMessage("RAG provider updated.");
  }

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-4">
      <div>
        <label className="text-xs text-[var(--muted)]">RAG provider</label>
        <select
          name="ragProvider"
          defaultValue={config.ragProvider}
          key={config.ragProvider}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="PGVECTOR">pgvector (PostgreSQL embeddings)</option>
          <option value="GEMINI_FILE_SEARCH">
            Gemini File Search (hosted index)
          </option>
        </select>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Current: {ragProviderLabel(config.ragProvider)}. New uploads and
          agent search use this provider.
        </p>
      </div>

      {config.ragProvider === "GEMINI_FILE_SEARCH" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
          <p>
            API key:{" "}
            {config.geminiApiKeyConfigured ? "configured" : "missing — set GEMINI_API_KEY"}
          </p>
          <p className="mt-1">
            File Search store:{" "}
            {config.geminiFileSearchStoreId ?? "created on first document upload"}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save RAG provider
      </button>
    </form>
  );
}

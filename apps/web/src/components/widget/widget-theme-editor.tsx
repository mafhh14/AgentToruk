"use client";

import type { WidgetThemeConfig } from "@agenttoruk/shared";
import { resolvePreviewPalette } from "@/lib/widget-theme/defaults";
import { hasPermission } from "@/lib/rbac";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export function WidgetPreview({
  theme,
  previewMode,
}: {
  theme: WidgetThemeConfig;
  previewMode: "light" | "dark";
}) {
  const colors = resolvePreviewPalette(theme, previewMode);
  const fontSize =
    theme.fontSize === "sm" ? "13px" : theme.fontSize === "lg" ? "15px" : "14px";

  return (
    <div
      className="relative h-[420px] overflow-hidden rounded-xl border border-[var(--border)] bg-slate-200 dark:bg-slate-900"
      style={{ fontFamily: theme.fontFamily }}
    >
      <div className="absolute inset-0 p-4 opacity-40">
        <div className="mb-3 h-3 w-1/3 rounded bg-slate-400/50" />
        <div className="mb-2 h-2 w-2/3 rounded bg-slate-400/40" />
        <div className="h-2 w-1/2 rounded bg-slate-400/40" />
      </div>

      <div
        className={`absolute bottom-4 flex flex-col ${
          theme.position === "bottom-left" ? "left-4 items-start" : "right-4 items-end"
        }`}
        style={{ width: 280 }}
      >
        <div
          style={{
            width: "100%",
            background: colors.background,
            color: colors.text,
            borderRadius: theme.borderRadius,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: colors.primary,
              color: "#fff",
              fontWeight: 600,
              fontSize,
            }}
          >
            Support
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: theme.borderRadius,
                background: colors.agentBubble,
                color: colors.text,
                fontSize,
              }}
            >
              {theme.welcomeMessage}
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: theme.borderRadius,
                background: colors.userBubble,
                color: "#fff",
                fontSize,
              }}
            >
              I need help with my order
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: theme.borderRadius,
                background: colors.agentBubble,
                color: colors.text,
                fontSize,
              }}
            >
              I&apos;d be happy to help! What&apos;s your order number?
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderTop: "1px solid rgba(128,128,128,0.2)",
            }}
          >
            <div
              style={{
                height: 36,
                borderRadius: theme.borderRadius,
                border: "1px solid rgba(128,128,128,0.3)",
                background: "transparent",
              }}
            />
          </div>
          {theme.showPoweredBy && (
            <div
              style={{
                textAlign: "center",
                padding: 4,
                fontSize: 10,
                opacity: 0.5,
                color: colors.text,
              }}
            >
              Powered by AgentToruk
            </div>
          )}
        </div>

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          💬
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent disabled:opacity-50"
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 font-mono text-xs outline-none ring-blue-600 focus:ring-2 disabled:opacity-50"
        />
      </div>
    </label>
  );
}

export function WidgetThemeEditor() {
  const [theme, setTheme] = useState<WidgetThemeConfig | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { data: session } = useSession();

  const canWrite =
    session?.user?.role &&
    hasPermission(session.user.role, "settings:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/widget-theme");
      if (res.ok) {
        const data = (await res.json()) as { theme: WidgetThemeConfig };
        setTheme(data.theme);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateTheme(partial: Partial<WidgetThemeConfig>) {
    setTheme((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function updateLight(key: keyof WidgetThemeConfig["light"], value: string) {
    setTheme((prev) =>
      prev ? { ...prev, light: { ...prev.light, [key]: value } } : prev,
    );
  }

  function updateDark(key: keyof WidgetThemeConfig["dark"], value: string) {
    setTheme((prev) =>
      prev ? { ...prev, dark: { ...prev.dark, [key]: value } } : prev,
    );
  }

  async function save() {
    if (!theme) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/widget-theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (res.ok) {
        const data = (await res.json()) as { theme: WidgetThemeConfig };
        setTheme(data.theme);
        setMessage("Theme saved. Changes apply to the embeddable widget.");
      } else {
        setMessage("Failed to save theme.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm("Reset widget theme to defaults?")) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/widget-theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (res.ok) {
        const data = (await res.json()) as { theme: WidgetThemeConfig };
        setTheme(data.theme);
        setMessage("Theme reset to defaults.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !theme) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const palette = previewMode === "dark" ? theme.dark : theme.light;

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">General</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--muted)]">Welcome message</span>
              <textarea
                value={theme.welcomeMessage}
                disabled={!canWrite}
                onChange={(e) => updateTheme({ welcomeMessage: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Position</span>
                <select
                  value={theme.position}
                  disabled={!canWrite}
                  onChange={(e) => updateTheme({ position: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Default theme</span>
                <select
                  value={theme.themeMode}
                  disabled={!canWrite}
                  onChange={(e) =>
                    updateTheme({
                      themeMode: e.target.value as WidgetThemeConfig["themeMode"],
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="auto">Auto (system)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Border radius</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={theme.borderRadius}
                  disabled={!canWrite}
                  onChange={(e) =>
                    updateTheme({ borderRadius: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-xs text-[var(--muted)]">{theme.borderRadius}px</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--muted)]">Font size</span>
                <select
                  value={theme.fontSize}
                  disabled={!canWrite}
                  onChange={(e) => updateTheme({ fontSize: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={theme.showPoweredBy}
                disabled={!canWrite}
                onChange={(e) => updateTheme({ showPoweredBy: e.target.checked })}
              />
              Show &quot;Powered by AgentToruk&quot;
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Colors</h2>
            <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode("light")}
                className={`rounded-md px-3 py-1 text-xs ${
                  previewMode === "light"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--muted)]"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("dark")}
                className={`rounded-md px-3 py-1 text-xs ${
                  previewMode === "dark"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--muted)]"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {previewMode === "light" ? (
              <>
                <ColorField label="Primary" value={theme.light.primary} onChange={(v) => updateLight("primary", v)} disabled={!canWrite} />
                <ColorField label="Background" value={theme.light.background} onChange={(v) => updateLight("background", v)} disabled={!canWrite} />
                <ColorField label="Text" value={theme.light.text} onChange={(v) => updateLight("text", v)} disabled={!canWrite} />
                <ColorField label="Agent bubble" value={theme.light.agentBubble} onChange={(v) => updateLight("agentBubble", v)} disabled={!canWrite} />
                <ColorField label="User bubble" value={theme.light.userBubble} onChange={(v) => updateLight("userBubble", v)} disabled={!canWrite} />
              </>
            ) : (
              <>
                <ColorField label="Primary" value={theme.dark.primary} onChange={(v) => updateDark("primary", v)} disabled={!canWrite} />
                <ColorField label="Background" value={theme.dark.background} onChange={(v) => updateDark("background", v)} disabled={!canWrite} />
                <ColorField label="Text" value={theme.dark.text} onChange={(v) => updateDark("text", v)} disabled={!canWrite} />
                <ColorField label="Agent bubble" value={theme.dark.agentBubble} onChange={(v) => updateDark("agentBubble", v)} disabled={!canWrite} />
                <ColorField label="User bubble" value={theme.dark.userBubble} onChange={(v) => updateDark("userBubble", v)} disabled={!canWrite} />
              </>
            )}
          </div>
        </section>

        {canWrite && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save theme"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Reset to defaults
            </button>
            {message && (
              <p className="text-sm text-[var(--muted)]">{message}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Live preview</h2>
          <p className="text-sm text-[var(--muted)]">
            Previewing {previewMode} mode · primary {palette.primary}
          </p>
        </div>
        <WidgetPreview theme={theme} previewMode={previewMode} />
        <p className="text-xs text-[var(--muted)]">
          Test the real widget on{" "}
          <a href="/widget-demo" className="text-blue-600 hover:underline">
            widget demo
          </a>{" "}
          after saving.
        </p>
      </div>
    </div>
  );
}
import { NextResponse } from "next/server";
import type { WidgetThemeConfig } from "@agenttoruk/shared";

const DEFAULT_CONFIG: WidgetThemeConfig = {
  welcomeMessage: "Hi! How can I help you today?",
  position: "bottom-right",
  themeMode: "auto",
  allowUserThemeToggle: true,
  light: {
    primary: "#2563eb",
    background: "#ffffff",
    text: "#1f2937",
    agentBubble: "#f3f4f6",
    userBubble: "#2563eb",
  },
  dark: {
    primary: "#3b82f6",
    background: "#111827",
    text: "#f9fafb",
    agentBubble: "#1f2937",
    userBubble: "#2563eb",
  },
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "md",
  borderRadius: 12,
  showPoweredBy: true,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const org = searchParams.get("org");

  if (!org) {
    return NextResponse.json({ error: "org parameter required" }, { status: 400 });
  }

  // TODO: Load from WidgetTheme table by organizationId (Phase 11)
  return NextResponse.json({
    ...DEFAULT_CONFIG,
    organizationId: org,
  });
}

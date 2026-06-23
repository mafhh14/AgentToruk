import { prisma } from "@agenttoruk/database";
import type { WidgetThemeConfig } from "@agenttoruk/shared";
import { corsHeaders, jsonWithCors, optionsCors } from "@/lib/cors";

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

export async function OPTIONS() {
  return optionsCors();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const org = searchParams.get("org");

  if (!org) {
    return jsonWithCors({ error: "org parameter required" }, { status: 400 });
  }

  const theme = await prisma.widgetTheme.findFirst({
    where: { organizationId: org },
    include: {
      organization: {
        select: { agentConfig: { select: { name: true } } },
      },
    },
  });

  if (!theme) {
    const exists = await prisma.organization.findUnique({ where: { id: org } });
    if (!exists) {
      return jsonWithCors({ error: "Invalid organization" }, { status: 404 });
    }
    return jsonWithCors({ ...DEFAULT_CONFIG, organizationId: org });
  }

  const config: WidgetThemeConfig = {
    welcomeMessage: theme.welcomeMessage,
    position: theme.position,
    themeMode: theme.themeMode.toLowerCase() as WidgetThemeConfig["themeMode"],
    allowUserThemeToggle: theme.allowUserThemeToggle,
    light: {
      primary: theme.lightPrimary,
      background: theme.lightBackground,
      text: theme.lightText,
      agentBubble: theme.lightAgentBubble,
      userBubble: theme.lightUserBubble,
    },
    dark: {
      primary: theme.darkPrimary,
      background: theme.darkBackground,
      text: theme.darkText,
      agentBubble: theme.darkAgentBubble,
      userBubble: theme.darkUserBubble,
    },
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    borderRadius: theme.borderRadius,
    showPoweredBy: theme.showPoweredBy,
  };

  return jsonWithCors(config, {
    headers: corsHeaders,
  });
}

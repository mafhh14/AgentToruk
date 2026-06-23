import type { ThemeMode } from "@agenttoruk/database";
import type { WidgetThemeConfig } from "@agenttoruk/shared";

export const DEFAULT_WIDGET_THEME: WidgetThemeConfig = {
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

export function themeModeToApi(mode: ThemeMode): WidgetThemeConfig["themeMode"] {
  return mode.toLowerCase() as WidgetThemeConfig["themeMode"];
}

export function themeModeFromApi(
  mode: WidgetThemeConfig["themeMode"],
): ThemeMode {
  switch (mode) {
    case "light":
      return "LIGHT";
    case "dark":
      return "DARK";
    default:
      return "AUTO";
  }
}

export function dbThemeToConfig(theme: {
  welcomeMessage: string;
  position: string;
  themeMode: ThemeMode;
  allowUserThemeToggle: boolean;
  lightPrimary: string;
  lightBackground: string;
  lightText: string;
  lightAgentBubble: string;
  lightUserBubble: string;
  darkPrimary: string;
  darkBackground: string;
  darkText: string;
  darkAgentBubble: string;
  darkUserBubble: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: number;
  showPoweredBy: boolean;
}): WidgetThemeConfig {
  return {
    welcomeMessage: theme.welcomeMessage,
    position: theme.position,
    themeMode: themeModeToApi(theme.themeMode),
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
}

export function configToDbUpdate(config: Partial<WidgetThemeConfig>) {
  return {
    ...(config.welcomeMessage !== undefined
      ? { welcomeMessage: config.welcomeMessage.slice(0, 500) }
      : {}),
    ...(config.position !== undefined ? { position: config.position } : {}),
    ...(config.themeMode !== undefined
      ? { themeMode: themeModeFromApi(config.themeMode) }
      : {}),
    ...(config.allowUserThemeToggle !== undefined
      ? { allowUserThemeToggle: config.allowUserThemeToggle }
      : {}),
    ...(config.light?.primary !== undefined
      ? { lightPrimary: config.light.primary }
      : {}),
    ...(config.light?.background !== undefined
      ? { lightBackground: config.light.background }
      : {}),
    ...(config.light?.text !== undefined ? { lightText: config.light.text } : {}),
    ...(config.light?.agentBubble !== undefined
      ? { lightAgentBubble: config.light.agentBubble }
      : {}),
    ...(config.light?.userBubble !== undefined
      ? { lightUserBubble: config.light.userBubble }
      : {}),
    ...(config.dark?.primary !== undefined
      ? { darkPrimary: config.dark.primary }
      : {}),
    ...(config.dark?.background !== undefined
      ? { darkBackground: config.dark.background }
      : {}),
    ...(config.dark?.text !== undefined ? { darkText: config.dark.text } : {}),
    ...(config.dark?.agentBubble !== undefined
      ? { darkAgentBubble: config.dark.agentBubble }
      : {}),
    ...(config.dark?.userBubble !== undefined
      ? { darkUserBubble: config.dark.userBubble }
      : {}),
    ...(config.fontFamily !== undefined ? { fontFamily: config.fontFamily } : {}),
    ...(config.fontSize !== undefined ? { fontSize: config.fontSize } : {}),
    ...(config.borderRadius !== undefined
      ? { borderRadius: Math.min(24, Math.max(0, config.borderRadius)) }
      : {}),
    ...(config.showPoweredBy !== undefined
      ? { showPoweredBy: config.showPoweredBy }
      : {}),
  };
}

export function resolvePreviewPalette(
  config: WidgetThemeConfig,
  previewMode: "light" | "dark",
): WidgetThemeConfig["light"] {
  return previewMode === "dark" ? config.dark : config.light;
}

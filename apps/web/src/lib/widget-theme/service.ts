import { prisma } from "@agenttoruk/database";
import type { WidgetThemeConfig } from "@agenttoruk/shared";
import {
  DEFAULT_WIDGET_THEME,
  configToDbUpdate,
  dbThemeToConfig,
} from "./defaults";

export async function getWidgetTheme(
  organizationId: string,
): Promise<WidgetThemeConfig> {
  const theme = await prisma.widgetTheme.findUnique({
    where: { organizationId },
  });

  if (!theme) {
    return { ...DEFAULT_WIDGET_THEME };
  }

  return dbThemeToConfig(theme);
}

export async function updateWidgetTheme(
  organizationId: string,
  actorId: string,
  updates: Partial<WidgetThemeConfig>,
): Promise<WidgetThemeConfig> {
  const data = configToDbUpdate(updates);

  const theme = await prisma.widgetTheme.upsert({
    where: { organizationId },
    create: {
      organizationId,
      ...configToDbUpdate({ ...DEFAULT_WIDGET_THEME, ...updates }),
    },
    update: data,
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId,
      action: "widget_theme.updated",
      resource: "widget_theme",
      resourceId: theme.id,
      metadata: { fields: Object.keys(updates) },
    },
  });

  return dbThemeToConfig(theme);
}

export async function resetWidgetTheme(
  organizationId: string,
  actorId: string,
): Promise<WidgetThemeConfig> {
  const theme = await prisma.widgetTheme.upsert({
    where: { organizationId },
    create: {
      organizationId,
      ...configToDbUpdate(DEFAULT_WIDGET_THEME),
    },
    update: configToDbUpdate(DEFAULT_WIDGET_THEME),
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId,
      action: "widget_theme.reset",
      resource: "widget_theme",
      resourceId: theme.id,
    },
  });

  return dbThemeToConfig(theme);
}

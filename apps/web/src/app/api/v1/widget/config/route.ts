import { prisma } from "@agenttoruk/database";
import type { WidgetThemeConfig } from "@agenttoruk/shared";
import { corsHeaders, jsonWithCors, optionsCors } from "@/lib/cors";
import {
  DEFAULT_WIDGET_THEME,
  dbThemeToConfig,
} from "@/lib/widget-theme/defaults";

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
  });

  if (!theme) {
    const exists = await prisma.organization.findUnique({ where: { id: org } });
    if (!exists) {
      return jsonWithCors({ error: "Invalid organization" }, { status: 404 });
    }
    return jsonWithCors(
      { ...DEFAULT_WIDGET_THEME, organizationId: org } as WidgetThemeConfig & {
        organizationId: string;
      },
    );
  }

  const config: WidgetThemeConfig = dbThemeToConfig(theme);

  return jsonWithCors(config, {
    headers: corsHeaders,
  });
}

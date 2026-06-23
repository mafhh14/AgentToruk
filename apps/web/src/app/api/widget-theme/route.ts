import { requireApiSession } from "@/lib/api-auth";
import {
  getWidgetTheme,
  resetWidgetTheme,
  updateWidgetTheme,
} from "@/lib/widget-theme/service";
import type { WidgetThemeConfig } from "@agenttoruk/shared";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("settings:read");
  if (auth.error) return auth.error;

  const theme = await getWidgetTheme(auth.session!.user.organizationId);
  return NextResponse.json({ theme });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession("settings:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      theme?: Partial<WidgetThemeConfig>;
      reset?: boolean;
    };

    if (body.reset) {
      const theme = await resetWidgetTheme(
        auth.session!.user.organizationId,
        auth.session!.user.id,
      );
      return NextResponse.json({ theme });
    }

    if (!body.theme || typeof body.theme !== "object") {
      return NextResponse.json(
        { error: "theme object is required" },
        { status: 400 },
      );
    }

    const theme = await updateWidgetTheme(
      auth.session!.user.organizationId,
      auth.session!.user.id,
      body.theme,
    );

    return NextResponse.json({ theme });
  } catch (error) {
    console.error("[widget-theme]", error);
    return NextResponse.json(
      { error: "Failed to update widget theme" },
      { status: 500 },
    );
  }
}

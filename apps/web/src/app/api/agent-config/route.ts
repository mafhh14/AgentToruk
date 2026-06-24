import { requireApiSession } from "@/lib/api-auth";
import { getAgentConfig, updateAgentConfig } from "@/lib/agent-config/service";
import type { RagProvider } from "@agenttoruk/database";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("agent:read");
  if (auth.error) return auth.error;

  const config = await getAgentConfig(auth.session!.user.organizationId);
  return NextResponse.json({ config });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession("agent:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as { ragProvider?: RagProvider };

    if (
      body.ragProvider &&
      body.ragProvider !== "PGVECTOR" &&
      body.ragProvider !== "GEMINI_FILE_SEARCH"
    ) {
      return NextResponse.json(
        { error: "Invalid ragProvider" },
        { status: 400 },
      );
    }

    const config = await updateAgentConfig(
      auth.session!.user.organizationId,
      auth.session!.user.id,
      { ragProvider: body.ragProvider },
    );

    return NextResponse.json({ config });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update agent config";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

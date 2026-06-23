import { requireApiSession } from "@/lib/api-auth";
import { claimConversation } from "@/lib/conversations/handoff";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("conversations:write");
  if (auth.error) return auth.error;

  try {
    const conversation = await claimConversation(
      auth.session!.user.organizationId,
      params.id,
      auth.session!.user.id,
    );

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to claim conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

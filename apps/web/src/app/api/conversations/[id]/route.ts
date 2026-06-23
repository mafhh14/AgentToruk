import type { ConversationStatus } from "@agenttoruk/database";
import { requireApiSession } from "@/lib/api-auth";
import {
  getConversation,
  updateConversation,
} from "@/lib/conversations/service";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("conversations:read");
  if (auth.error) return auth.error;

  const conversation = await getConversation(
    auth.session!.user.organizationId,
    params.id,
  );

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("conversations:write");
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    status?: ConversationStatus;
    summary?: string;
    assignedUserId?: string | null;
  };

  const conversation = await updateConversation(
    auth.session!.user.organizationId,
    params.id,
    body,
  );

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

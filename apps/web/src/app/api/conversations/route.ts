import type { ConversationStatus } from "@agenttoruk/database";
import { requireApiSession } from "@/lib/api-auth";
import { listConversations } from "@/lib/conversations/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiSession("conversations:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ConversationStatus | null;
  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  const result = await listConversations(auth.session!.user.organizationId, {
    status: status ?? undefined,
    search,
    page: Number.isNaN(page) ? 1 : page,
    limit: Number.isNaN(limit) ? 20 : limit,
  });

  return NextResponse.json(result);
}

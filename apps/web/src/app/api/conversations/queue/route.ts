import { requireApiSession } from "@/lib/api-auth";
import { listHandoffQueue } from "@/lib/conversations/handoff";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("conversations:read");
  if (auth.error) return auth.error;

  const queue = await listHandoffQueue(auth.session!.user.organizationId);
  return NextResponse.json({ queue });
}

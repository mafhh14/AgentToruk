import { requireApiSession } from "@/lib/api-auth";
import { createAgentRealtimeToken, getPublicRealtimeUrl } from "@/lib/realtime/emit";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("conversations:read");
  if (auth.error) return auth.error;

  const token = createAgentRealtimeToken({
    organizationId: auth.session!.user.organizationId,
    userId: auth.session!.user.id,
    userName: auth.session!.user.name,
  });

  return NextResponse.json({
    token,
    url: getPublicRealtimeUrl(),
  });
}

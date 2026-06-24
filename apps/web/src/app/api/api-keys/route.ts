import { requireApiSession } from "@/lib/api-auth";
import { createApiKey, listApiKeys } from "@/lib/api-keys/service";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("settings:read");
  if (auth.error) return auth.error;

  const keys = await listApiKeys(auth.session!.user.organizationId);
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const auth = await requireApiSession("settings:write");
  if (auth.error) return auth.error;

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim() || "API key";

  const created = await createApiKey(auth.session!.user.organizationId, name);
  return NextResponse.json({ key: created });
}

import { requireApiSession } from "@/lib/api-auth";
import { listWorkflowRules } from "@/lib/workflows/service";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("workflows:read");
  if (auth.error) return auth.error;

  const rules = await listWorkflowRules(auth.session!.user.organizationId);
  return NextResponse.json({ rules });
}

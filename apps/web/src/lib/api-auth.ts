import type { Permission } from "@/lib/rbac";
import { hasPermission } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireApiSession(permission?: Permission) {
  const session = await getSession();

  if (!session?.user?.id || !session.user.organizationId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (permission && !hasPermission(session.user.role, permission)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

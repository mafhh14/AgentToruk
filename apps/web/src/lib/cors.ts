import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonWithCors<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function optionsCors() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function validateOrganization(orgId: string) {
  const { prisma } = await import("@agenttoruk/database");
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
}

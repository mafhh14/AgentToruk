import { prisma } from "@agenttoruk/database";
import { applyIndustryPack } from "@/lib/industry/service";

export function slugifyOrganizationName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "org"}-${suffix}`;
}

export async function bootstrapOrganization(
  orgId: string,
  actorId?: string,
): Promise<void> {
  await applyIndustryPack(orgId, "general-support", actorId ?? "system", {
    seedKnowledge: true,
    seedWorkflows: true,
  });
}

export async function getUserMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

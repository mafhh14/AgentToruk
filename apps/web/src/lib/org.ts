import { prisma } from "@agenttoruk/database";

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

export async function bootstrapOrganization(orgId: string): Promise<void> {
  await prisma.agentConfig.create({
    data: {
      organizationId: orgId,
      name: "Support Agent",
      personality:
        "You are a helpful, professional customer support agent. Be concise and empathetic.",
      tone: "professional",
      businessDescription: "",
      fallbackMessage:
        "I'm not sure about that. Let me connect you with a human agent who can help.",
    },
  });

  await prisma.widgetTheme.create({
    data: {
      organizationId: orgId,
    },
  });
}

export async function getUserMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

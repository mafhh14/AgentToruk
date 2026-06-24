import { prisma } from "@agenttoruk/database";

export async function listWorkflowRules(organizationId: string) {
  return prisma.workflowRule.findMany({
    where: { organizationId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

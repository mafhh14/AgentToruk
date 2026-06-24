import { prisma } from "@agenttoruk/database";

export async function getAnalyticsSummary(organizationId: string) {
  const [
    totalConversations,
    resolvedConversations,
    escalatedConversations,
    ratings,
    ticketsOpen,
    ticketsResolved,
    indexedDocs,
  ] = await Promise.all([
    prisma.conversation.count({ where: { organizationId } }),
    prisma.conversation.count({
      where: { organizationId, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.conversation.count({
      where: { organizationId, status: "ESCALATED" },
    }),
    prisma.conversationRating.findMany({
      where: { conversation: { organizationId } },
      select: { score: true },
    }),
    prisma.ticket.count({
      where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"] } },
    }),
    prisma.ticket.count({
      where: { organizationId, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.knowledgeDocument.count({
      where: { organizationId, status: "INDEXED" },
    }),
  ]);

  const csatAvg =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : null;

  const aiResolutionRate =
    totalConversations > 0
      ? Math.round(
          ((totalConversations - escalatedConversations) / totalConversations) *
            100,
        )
      : null;

  return {
    totalConversations,
    resolvedConversations,
    escalatedConversations,
    aiResolutionRate,
    csatAvg,
    csatCount: ratings.length,
    ticketsOpen,
    ticketsResolved,
    indexedDocs,
  };
}

import type { Industry, Prisma } from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import {
  getIndustryPack,
  type IndustryPack,
  type IndustryType,
} from "@agenttoruk/industry-packs";

const INDUSTRY_TO_DB: Record<IndustryType, Industry> = {
  general: "GENERAL",
  hospitality: "HOSPITALITY",
  travel: "TRAVEL",
  ecommerce: "ECOMMERCE",
  saas: "SAAS",
};

const DB_TO_INDUSTRY: Record<Industry, IndustryType> = {
  GENERAL: "general",
  HOSPITALITY: "hospitality",
  TRAVEL: "travel",
  ECOMMERCE: "ecommerce",
  SAAS: "saas",
};

export function industryToDb(industry: IndustryType): Industry {
  return INDUSTRY_TO_DB[industry];
}

export function industryFromDb(industry: Industry): IndustryType {
  return DB_TO_INDUSTRY[industry];
}

export async function getOrganizationIndustry(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      industry: true,
      industryPackId: true,
      integrationConfig: true,
    },
  });

  if (!org) return null;

  const pack = getIndustryPack(org.industryPackId) ?? getIndustryPack("general-support")!;

  return {
    industry: industryFromDb(org.industry),
    industryDb: org.industry,
    industryPackId: org.industryPackId,
    pack,
    integrationConfig: org.integrationConfig,
  };
}

export async function applyIndustryPack(
  organizationId: string,
  packId: string,
  actorId: string,
  options?: { seedKnowledge?: boolean; seedWorkflows?: boolean },
): Promise<IndustryPack> {
  const pack = getIndustryPack(packId);
  if (!pack) {
    throw new Error(`Unknown industry pack: ${packId}`);
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      industry: industryToDb(pack.industry),
      industryPackId: pack.id,
      integrationConfig: {
        connectors: pack.connectors,
        appliedAt: new Date().toISOString(),
      },
    },
  });

  await prisma.agentConfig.upsert({
    where: { organizationId },
    create: {
      organizationId,
      name: `${pack.name} Agent`,
      personality: pack.personality,
      businessDescription: pack.businessDescription,
      tone: pack.tone,
      allowedActions: pack.allowedActions,
    },
    update: {
      personality: pack.personality,
      businessDescription: pack.businessDescription,
      tone: pack.tone,
      allowedActions: pack.allowedActions,
    },
  });

  await prisma.widgetTheme.upsert({
    where: { organizationId },
    create: {
      organizationId,
      welcomeMessage: pack.widget.welcomeMessage,
    },
    update: {
      welcomeMessage: pack.widget.welcomeMessage,
    },
  });

  if (options?.seedWorkflows !== false) {
    await prisma.workflowRule.deleteMany({
      where: {
        organizationId,
        trigger: "intent_classified",
      },
    });

    for (const template of pack.workflowTemplates) {
      await prisma.workflowRule.create({
        data: {
          organizationId,
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          conditions: template.conditions as Prisma.InputJsonValue,
          actions: template.actions as Prisma.InputJsonValue,
          priority: template.priority,
        },
      });
    }
  }

  if (options?.seedKnowledge !== false) {
    for (const doc of pack.starterKnowledge) {
      const existing = await prisma.knowledgeDocument.findFirst({
        where: { organizationId, name: doc.name },
      });

      if (existing) continue;

      const created = await prisma.knowledgeDocument.create({
        data: {
          organizationId,
          name: doc.name,
          sourceType: "txt",
          status: "PENDING",
          metadata: { industryPackSeed: pack.id },
        },
      });

      const { getRagProviderForOrganization } = await import(
        "@/lib/knowledge/rag-provider"
      );
      const rag = await getRagProviderForOrganization(organizationId);
      await rag.ingest({
        organizationId,
        documentId: created.id,
        name: doc.name,
        sourceType: "txt",
        content: doc.content,
      });
    }
  }

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId,
      action: "industry_pack.applied",
      resource: "organization",
      resourceId: organizationId,
      metadata: { packId: pack.id, industry: pack.industry },
    },
  });

  return pack;
}

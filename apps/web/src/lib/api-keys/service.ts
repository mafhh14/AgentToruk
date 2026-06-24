import { randomBytes, createHash } from "crypto";
import { prisma } from "@agenttoruk/database";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function listApiKeys(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function createApiKey(organizationId: string, name: string) {
  const raw = `atk_${randomBytes(24).toString("hex")}`;
  const keyPrefix = raw.slice(0, 12);

  const record = await prisma.apiKey.create({
    data: {
      organizationId,
      name,
      keyHash: hashKey(raw),
      keyPrefix,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
    },
  });

  return { ...record, key: raw };
}

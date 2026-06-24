import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@agenttoruk/database";
import { extractTextFromFile, extractTextFromUrl } from "./extract";
import { getRagProviderForOrganization } from "./rag-provider";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function listDocuments(organizationId: string) {
  return prisma.knowledgeDocument.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chunks: true } },
    },
  });
}

export async function ingestFromFile(input: {
  organizationId: string;
  file: File;
}) {
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const doc = await prisma.knowledgeDocument.create({
    data: {
      organizationId: input.organizationId,
      name: input.file.name,
      sourceType: path.extname(safeName).slice(1) || "file",
      mimeType: input.file.type || undefined,
      fileSize: buffer.length,
      status: "PENDING",
    },
  });

  const orgDir = path.join(UPLOAD_DIR, input.organizationId);
  await mkdir(orgDir, { recursive: true });
  const filePath = path.join(orgDir, `${doc.id}_${safeName}`);
  await writeFile(filePath, buffer);

  await prisma.knowledgeDocument.update({
    where: { id: doc.id },
    data: { filePath },
  });

  try {
    const text = await extractTextFromFile(filePath, input.file.type);
    if (!text.trim()) {
      throw new Error("No extractable text in file");
    }

    const rag = await getRagProviderForOrganization(input.organizationId);
    await rag.ingest({
      organizationId: input.organizationId,
      documentId: doc.id,
      name: doc.name,
      sourceType: doc.sourceType as "pdf" | "txt" | "docx" | "url",
      content: text,
      filePath,
      mimeType: input.file.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: "FAILED", errorMessage: message },
    });
    throw error;
  }

  return prisma.knowledgeDocument.findUnique({
    where: { id: doc.id },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function ingestFromUrl(input: {
  organizationId: string;
  url: string;
  name?: string;
}) {
  const text = await extractTextFromUrl(input.url);
  if (!text.trim()) {
    throw new Error("No extractable text from URL");
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      organizationId: input.organizationId,
      name: input.name ?? new URL(input.url).hostname,
      sourceType: "url",
      sourceUrl: input.url,
      status: "PENDING",
    },
  });

  try {
    const rag = await getRagProviderForOrganization(input.organizationId);
    await rag.ingest({
      organizationId: input.organizationId,
      documentId: doc.id,
      name: doc.name,
      sourceType: "url",
      content: text,
      sourceUrl: input.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: "FAILED", errorMessage: message },
    });
    throw error;
  }

  return prisma.knowledgeDocument.findUnique({
    where: { id: doc.id },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function deleteDocument(
  organizationId: string,
  documentId: string,
) {
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, organizationId },
  });

  if (!doc) return null;

  const rag = await getRagProviderForOrganization(organizationId);
  await rag.delete(documentId, organizationId);

  if (doc.filePath) {
    try {
      await unlink(doc.filePath);
    } catch {
      // file may already be gone
    }
  }

  await prisma.knowledgeDocument.delete({ where: { id: documentId } });
  return { deleted: true };
}

export async function reindexDocument(
  organizationId: string,
  documentId: string,
) {
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, organizationId },
  });

  if (!doc) return null;

  let text: string;

  if (doc.filePath) {
    text = await extractTextFromFile(doc.filePath, doc.mimeType);
  } else if (doc.sourceUrl) {
    text = await extractTextFromUrl(doc.sourceUrl);
  } else {
    throw new Error("No file or URL to reindex");
  }

  const rag = await getRagProviderForOrganization(organizationId);
  await rag.ingest({
    organizationId,
    documentId: doc.id,
    name: doc.name,
    sourceType: doc.sourceType as "pdf" | "txt" | "docx" | "url",
    content: text,
    filePath: doc.filePath ?? undefined,
    sourceUrl: doc.sourceUrl ?? undefined,
  });

  return prisma.knowledgeDocument.findUnique({
    where: { id: doc.id },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function searchKnowledge(
  organizationId: string,
  query: string,
  limit = 5,
) {
  const rag = await getRagProviderForOrganization(organizationId);
  return rag.search({ organizationId, query, limit });
}

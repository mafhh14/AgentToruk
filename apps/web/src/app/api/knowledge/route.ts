import { requireApiSession } from "@/lib/api-auth";
import {
  ingestFromUrl,
  listDocuments,
} from "@/lib/knowledge/service";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("knowledge:read");
  if (auth.error) return auth.error;

  const documents = await listDocuments(auth.session!.user.organizationId);

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      sourceType: d.sourceType,
      sourceUrl: d.sourceUrl,
      status: d.status,
      errorMessage: d.errorMessage,
      chunkCount: d._count.chunks,
      fileSize: d.fileSize,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession("knowledge:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as { url?: string; name?: string };

    if (!body.url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const document = await ingestFromUrl({
      organizationId: auth.session!.user.organizationId,
      url: body.url.trim(),
      name: body.name?.trim(),
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

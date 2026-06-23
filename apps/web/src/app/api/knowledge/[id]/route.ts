import { requireApiSession } from "@/lib/api-auth";
import {
  deleteDocument,
  reindexDocument,
} from "@/lib/knowledge/service";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("knowledge:write");
  if (auth.error) return auth.error;

  const result = await deleteDocument(
    auth.session!.user.organizationId,
    params.id,
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("knowledge:write");
  if (auth.error) return auth.error;

  const body = (await request.json()) as { action?: string };

  if (body.action !== "reindex") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const document = await reindexDocument(
      auth.session!.user.organizationId,
      params.id,
    );

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reindex failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

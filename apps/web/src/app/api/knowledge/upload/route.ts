import { requireApiSession } from "@/lib/api-auth";
import { ingestFromFile } from "@/lib/knowledge/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireApiSession("knowledge:write");
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = ["pdf", "txt", "md"];

    if (
      !allowed.includes(file.type) &&
      (!ext || !allowedExt.includes(ext))
    ) {
      return NextResponse.json(
        { error: "Supported types: PDF, TXT, MD" },
        { status: 400 },
      );
    }

    const document = await ingestFromFile({
      organizationId: auth.session!.user.organizationId,
      file,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

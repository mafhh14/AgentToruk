import { requireApiSession } from "@/lib/api-auth";
import { addHumanMessage } from "@/lib/conversations/service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("conversations:write");
  if (auth.error) return auth.error;

  const body = (await request.json()) as { content?: string };

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    const message = await addHumanMessage({
      conversationId: params.id,
      organizationId: auth.session!.user.organizationId,
      content: body.content.trim(),
      authorId: auth.session!.user.id,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
}

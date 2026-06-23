import { requireApiSession } from "@/lib/api-auth";
import { addTicketNote } from "@/lib/tickets/service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("tickets:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      content?: string;
      isInternal?: boolean;
    };

    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 },
      );
    }

    const note = await addTicketNote(
      auth.session!.user.organizationId,
      params.id,
      auth.session!.user.id,
      content,
      body.isInternal ?? true,
    );

    if (!note) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[ticket note]", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 },
    );
  }
}

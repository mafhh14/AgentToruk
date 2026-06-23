import type { TicketPriority, TicketStatus } from "@agenttoruk/database";
import { requireApiSession } from "@/lib/api-auth";
import { createTicket, listTickets } from "@/lib/tickets/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiSession("tickets:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const search = searchParams.get("search") ?? undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  const result = await listTickets(auth.session!.user.organizationId, {
    status: status ?? undefined,
    priority: priority ?? undefined,
    search,
    assigneeId,
    page: Number.isNaN(page) ? 1 : page,
    limit: Number.isNaN(limit) ? 20 : limit,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireApiSession("tickets:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      priority?: TicketPriority;
      conversationId?: string;
      assigneeId?: string;
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const ticket = await createTicket(
      auth.session!.user.organizationId,
      auth.session!.user.id,
      {
        title,
        description: body.description?.trim(),
        priority: body.priority,
        conversationId: body.conversationId,
        assigneeId: body.assigneeId,
      },
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("[tickets create]", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}

import type { TicketPriority, TicketStatus } from "@agenttoruk/database";
import { requireApiSession } from "@/lib/api-auth";
import { getTicket, updateTicket } from "@/lib/tickets/service";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("tickets:read");
  if (auth.error) return auth.error;

  const ticket = await getTicket(
    auth.session!.user.organizationId,
    params.id,
  );

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireApiSession("tickets:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string | null;
    };

    const ticket = await updateTicket(
      auth.session!.user.organizationId,
      params.id,
      auth.session!.user.id,
      body,
    );

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[tickets update]", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 },
    );
  }
}

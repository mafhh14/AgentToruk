import type {
  Prisma,
  TicketPriority,
  TicketStatus,
} from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";

export async function getTicketStats(organizationId: string) {
  const [open, inProgress, total] = await Promise.all([
    prisma.ticket.count({
      where: { organizationId, status: "OPEN" },
    }),
    prisma.ticket.count({
      where: { organizationId, status: "IN_PROGRESS" },
    }),
    prisma.ticket.count({ where: { organizationId } }),
  ]);

  return { open, inProgress, total };
}

export async function listTickets(
  organizationId: string,
  options: {
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
    assigneeId?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    organizationId,
    ...(options.status ? { status: options.status } : {}),
    ...(options.priority ? { priority: options.priority } : {}),
    ...(options.assigneeId ? { assigneeId: options.assigneeId } : {}),
    ...(options.search
      ? {
          OR: [
            { title: { contains: options.search, mode: "insensitive" } },
            { description: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        conversation: {
          select: { id: true, visitorName: true, visitorEmail: true },
        },
        _count: { select: { notes: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets: tickets.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
      conversation: t.conversation,
      noteCount: t._count.notes,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
      closedAt: t.closedAt?.toISOString() ?? null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicket(organizationId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      conversation: {
        select: {
          id: true,
          visitorName: true,
          visitorEmail: true,
          status: true,
        },
      },
      notes: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!ticket) return null;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    assignee: ticket.assignee,
    conversation: ticket.conversation,
    notes: ticket.notes.map((n) => ({
      id: n.id,
      content: n.content,
      isInternal: n.isInternal,
      author: n.author,
      createdAt: n.createdAt.toISOString(),
    })),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
  };
}

export async function createTicket(
  organizationId: string,
  actorId: string,
  data: {
    title: string;
    description?: string;
    priority?: TicketPriority;
    conversationId?: string;
    assigneeId?: string;
  },
) {
  const ticket = await prisma.ticket.create({
    data: {
      organizationId,
      title: data.title.slice(0, 200),
      description: data.description,
      priority: data.priority ?? "MEDIUM",
      conversationId: data.conversationId,
      assigneeId: data.assigneeId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      conversation: {
        select: { id: true, visitorName: true, visitorEmail: true },
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId,
      action: "ticket.created",
      resource: "ticket",
      resourceId: ticket.id,
      metadata: {
        title: ticket.title,
        priority: ticket.priority,
        conversationId: data.conversationId,
      },
    },
  });

  return ticket;
}

export async function updateTicket(
  organizationId: string,
  ticketId: string,
  actorId: string,
  data: {
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string | null;
  },
) {
  const existing = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId },
  });

  if (!existing) return null;

  const now = new Date();
  const statusTimestamps: Partial<{
    resolvedAt: Date | null;
    closedAt: Date | null;
  }> = {};

  if (data.status && data.status !== existing.status) {
    if (data.status === "RESOLVED") {
      statusTimestamps.resolvedAt = now;
    } else if (data.status === "CLOSED") {
      statusTimestamps.closedAt = now;
      if (!existing.resolvedAt) {
        statusTimestamps.resolvedAt = now;
      }
    } else if (
      existing.status === "RESOLVED" ||
      existing.status === "CLOSED"
    ) {
      statusTimestamps.resolvedAt = null;
      statusTimestamps.closedAt = null;
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(data.title !== undefined ? { title: data.title.slice(0, 200) } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.assigneeId !== undefined
        ? { assigneeId: data.assigneeId }
        : {}),
      ...statusTimestamps,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      conversation: {
        select: { id: true, visitorName: true, visitorEmail: true },
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId,
      actorId,
      action: "ticket.updated",
      resource: "ticket",
      resourceId: ticket.id,
      metadata: {
        changes: data,
      },
    },
  });

  return ticket;
}

export async function addTicketNote(
  organizationId: string,
  ticketId: string,
  authorId: string,
  content: string,
  isInternal = true,
) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId },
  });

  if (!ticket) return null;

  const note = await prisma.ticketNote.create({
    data: {
      ticketId,
      authorId,
      content,
      isInternal,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return note;
}

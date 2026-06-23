import { NextResponse } from "next/server";
import type { MembershipRole } from "@agenttoruk/database";
import { prisma } from "@agenttoruk/database";
import { getSession } from "@/lib/session";
import { canManageTeam } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.membership.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageTeam(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      role?: MembershipRole;
    };

    const email = body.email?.toLowerCase().trim();
    const name = body.name?.trim();
    const role = body.role ?? "SUPPORT_AGENT";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validRoles: MembershipRole[] =
      session.user.role === "OWNER"
        ? ["ADMIN", "SUPPORT_AGENT", "VIEWER"]
        : ["SUPPORT_AGENT", "VIEWER"];

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (session.user.role !== "OWNER" && role === "ADMIN") {
      return NextResponse.json(
        { error: "Only owners can invite admins" },
        { status: 403 },
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new users" },
          { status: 400 },
        );
      }

      user = await prisma.user.create({
        data: { email, name },
      });
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.user.organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 409 },
      );
    }

    const membership = await prisma.membership.create({
      data: {
        organizationId: session.user.organizationId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: session.user.organizationId,
        actorId: session.user.id,
        action: "team.member_invited",
        resource: "membership",
        resourceId: membership.id,
        metadata: { email, role },
      },
    });

    return NextResponse.json({ member: membership }, { status: 201 });
  } catch (error) {
    console.error("[team invite]", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 },
    );
  }
}

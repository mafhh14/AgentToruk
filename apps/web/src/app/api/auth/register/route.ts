import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@agenttoruk/database";
import { bootstrapOrganization, slugifyOrganizationName } from "@/lib/org";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      organizationName?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;
    const organizationName = body.organizationName?.trim();

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = slugifyOrganizationName(organizationName);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      return { organization, user };
    });

    await bootstrapOrganization(result.organization.id);

    await prisma.auditEvent.create({
      data: {
        organizationId: result.organization.id,
        actorId: result.user.id,
        action: "organization.created",
        resource: "organization",
        resourceId: result.organization.id,
        metadata: { email, organizationName },
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        organizationId: result.organization.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}

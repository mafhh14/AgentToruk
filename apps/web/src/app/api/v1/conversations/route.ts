import {
  createConversation,
  getConversationStats,
} from "@/lib/conversations/service";
import { jsonWithCors, optionsCors, validateOrganization } from "@/lib/cors";

export async function OPTIONS() {
  return optionsCors();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      organizationId?: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorId?: string;
      message?: string;
    };

    const organizationId = body.organizationId;

    if (!organizationId) {
      return jsonWithCors(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const org = await validateOrganization(organizationId);
    if (!org) {
      return jsonWithCors({ error: "Invalid organization" }, { status: 404 });
    }

    const conversation = await createConversation({
      organizationId,
      visitorName: body.visitorName?.trim(),
      visitorEmail: body.visitorEmail?.trim(),
      visitorId: body.visitorId,
      initialMessage: body.message,
    });

    return jsonWithCors({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[v1/conversations POST]", error);
    return jsonWithCors(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return jsonWithCors(
      { error: "organizationId is required" },
      { status: 400 },
    );
  }

  const org = await validateOrganization(organizationId);
  if (!org) {
    return jsonWithCors({ error: "Invalid organization" }, { status: 404 });
  }

  const stats = await getConversationStats(organizationId);
  return jsonWithCors({ stats });
}

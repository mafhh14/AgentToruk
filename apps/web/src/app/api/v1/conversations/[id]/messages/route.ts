import {
  getConversation,
  processUserMessage,
  updateConversation,
} from "@/lib/conversations/service";
import { emitNewMessage } from "@/lib/realtime/emit";
import { jsonWithCors, optionsCors, validateOrganization } from "@/lib/cors";
import { prisma } from "@agenttoruk/database";

export async function OPTIONS() {
  return optionsCors();
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return jsonWithCors(
      { error: "organizationId is required" },
      { status: 400 },
    );
  }

  const conversation = await getConversation(organizationId, params.id);

  if (!conversation) {
    return jsonWithCors({ error: "Not found" }, { status: 404 });
  }

  return jsonWithCors({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      assignedUserId: conversation.assignedUserId,
    },
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json()) as {
      organizationId?: string;
      content?: string;
      action?: "escalate";
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

    if (body.action === "escalate") {
      const conversation = await updateConversation(
        organizationId,
        params.id,
        { status: "ESCALATED" },
      );

      if (!conversation) {
        return jsonWithCors({ error: "Not found" }, { status: 404 });
      }

      const systemMessage = await prisma.message.create({
        data: {
          conversationId: params.id,
          role: "SYSTEM",
          content:
            "You've been connected to our support queue. A team member will join shortly.",
        },
      });

      await emitNewMessage(params.id, organizationId, {
        id: systemMessage.id,
        role: systemMessage.role,
        content: systemMessage.content,
        createdAt: systemMessage.createdAt,
      });

      return jsonWithCors({
        conversation: {
          id: conversation.id,
          status: conversation.status,
        },
        message: {
          id: systemMessage.id,
          role: systemMessage.role,
          content: systemMessage.content,
          createdAt: systemMessage.createdAt,
        },
        escalated: true,
      });
    }

    if (!body.content?.trim()) {
      return jsonWithCors({ error: "content is required" }, { status: 400 });
    }

    const result = await processUserMessage({
      conversationId: params.id,
      organizationId,
      content: body.content.trim(),
    });

    return jsonWithCors(
      {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        handoff: result.handoff,
        escalated: "escalated" in result ? result.escalated : false,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    const status = message.includes("not found")
      ? 404
      : message.includes("closed")
        ? 400
        : 500;
    return jsonWithCors({ error: message }, { status });
  }
}

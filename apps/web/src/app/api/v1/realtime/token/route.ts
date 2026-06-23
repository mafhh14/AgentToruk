import { prisma } from "@agenttoruk/database";
import { createVisitorRealtimeToken, getPublicRealtimeUrl } from "@/lib/realtime/emit";
import { jsonWithCors, optionsCors } from "@/lib/cors";

export async function OPTIONS() {
  return optionsCors();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const conversationId = searchParams.get("conversationId");
  const visitorId = searchParams.get("visitorId");

  if (!organizationId || !conversationId || !visitorId) {
    return jsonWithCors(
      { error: "organizationId, conversationId, and visitorId are required" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId,
      visitorId,
    },
  });

  if (!conversation) {
    return jsonWithCors({ error: "Conversation not found" }, { status: 404 });
  }

  const token = createVisitorRealtimeToken({
    organizationId,
    conversationId,
    visitorId,
  });

  return jsonWithCors({
    token,
    url: getPublicRealtimeUrl(),
  });
}

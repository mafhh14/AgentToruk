import { getConversation } from "@/lib/conversations/service";
import { jsonWithCors, optionsCors, validateOrganization } from "@/lib/cors";

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

  const org = await validateOrganization(organizationId);
  if (!org) {
    return jsonWithCors({ error: "Invalid organization" }, { status: 404 });
  }

  const conversation = await getConversation(organizationId, params.id);

  if (!conversation) {
    return jsonWithCors({ error: "Not found" }, { status: 404 });
  }

  return jsonWithCors({ conversation });
}

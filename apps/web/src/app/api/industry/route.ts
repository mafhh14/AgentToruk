import { requireApiSession } from "@/lib/api-auth";
import {
  applyIndustryPack,
  getOrganizationIndustry,
} from "@/lib/industry/service";
import { INDUSTRY_PACKS, getConnectorsForIndustry } from "@agenttoruk/industry-packs";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiSession("settings:read");
  if (auth.error) return auth.error;

  const orgId = auth.session!.user.organizationId;
  const current = await getOrganizationIndustry(orgId);

  return NextResponse.json({
    packs: INDUSTRY_PACKS.map((p) => ({
      id: p.id,
      industry: p.industry,
      name: p.name,
      description: p.description,
      suggestedQuestions: p.widget.suggestedQuestions,
      connectors: p.connectors,
    })),
    current: current
      ? {
          industry: current.industry,
          industryPackId: current.industryPackId,
          packName: current.pack.name,
          connectors: getConnectorsForIndustry(current.industry),
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession("settings:write");
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      packId?: string;
      seedKnowledge?: boolean;
    };

    if (!body.packId) {
      return NextResponse.json({ error: "packId is required" }, { status: 400 });
    }

    const pack = await applyIndustryPack(
      auth.session!.user.organizationId,
      body.packId,
      auth.session!.user.id,
      { seedKnowledge: body.seedKnowledge ?? true },
    );

    return NextResponse.json({
      applied: true,
      pack: {
        id: pack.id,
        name: pack.name,
        industry: pack.industry,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to apply industry pack";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

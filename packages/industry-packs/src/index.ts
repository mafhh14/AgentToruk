import { generalSupportPack } from "./packs/general";
import { hospitalityPack } from "./packs/hospitality";
import { travelPack } from "./packs/travel";
import type { IndustryPack, IndustryType } from "./types";

export * from "./types";
export * from "./connectors";
export { generalSupportPack, hospitalityPack, travelPack };

export const INDUSTRY_PACKS: IndustryPack[] = [
  generalSupportPack,
  hospitalityPack,
  travelPack,
];

export function getIndustryPack(id: string): IndustryPack | undefined {
  return INDUSTRY_PACKS.find((p) => p.id === id);
}

export function listIndustryPacks(industry?: IndustryType): IndustryPack[] {
  if (!industry) return INDUSTRY_PACKS;
  return INDUSTRY_PACKS.filter((p) => p.industry === industry);
}

export function industryTypeFromPackId(packId: string): IndustryType {
  return getIndustryPack(packId)?.industry ?? "general";
}

export const VERTICAL_TOOL_NAMES = [
  "lookup_reservation",
  "lookup_booking",
] as const;

export type VerticalToolName = (typeof VERTICAL_TOOL_NAMES)[number];

export function isVerticalTool(name: string): name is VerticalToolName {
  return (VERTICAL_TOOL_NAMES as readonly string[]).includes(name);
}

import type { IntegrationConnector } from "./types";

export const INTEGRATION_CONNECTORS: IntegrationConnector[] = [
  {
    id: "mock-pms",
    name: "Mock PMS",
    description: "Demo property management system for hotels (reservations, rooms).",
    industries: ["hospitality"],
    status: "mock",
  },
  {
    id: "mock-booking-api",
    name: "Mock Booking API",
    description: "Demo travel booking lookup for flights and hotels.",
    industries: ["travel"],
    status: "mock",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments and refunds (planned).",
    industries: ["general", "hospitality", "travel", "ecommerce", "saas"],
    status: "planned",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "E-commerce order lookup (planned).",
    industries: ["ecommerce"],
    status: "planned",
  },
];

export function getConnectorsForIndustry(
  industry: IntegrationConnector["industries"][number],
): IntegrationConnector[] {
  return INTEGRATION_CONNECTORS.filter((c) => c.industries.includes(industry));
}

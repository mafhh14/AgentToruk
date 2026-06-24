import type { IndustryPack } from "../types";

export const hospitalityPack: IndustryPack = {
  id: "hospitality-standard",
  industry: "hospitality",
  name: "Hospitality — Hotels & Resorts",
  description:
    "Guest support for reservations, check-in, amenities, and stay changes.",
  intents: [
    "reservation",
    "check_in",
    "room_service",
    "amenities",
    "cancellation",
    "late_checkout",
  ],
  intentPromptAddon: `
Additional hospitality intents (use when applicable):
- reservation: booking lookup, dates, room type
- check_in: arrival, early check-in, documents
- room_service: housekeeping, towels, maintenance in room
- amenities: pool, gym, breakfast, parking, Wi‑Fi
- cancellation: cancel or modify a stay
- late_checkout: extend checkout time`,
  personality:
    "You are a warm, professional hotel guest services agent. Use welcoming language and confirm reservation details before making promises.",
  businessDescription:
    "We operate a hotel and help guests with reservations, check-in, amenities, and stay-related requests.",
  tone: "warm and professional",
  allowedActions: [
    "search_knowledge_base",
    "lookup_reservation",
    "create_ticket",
    "escalate_to_human",
  ],
  ticketIntents: [
    "cancellation",
    "complaint",
    "room_service",
    "late_checkout",
    "billing",
    "refund",
  ],
  lookupIntentTools: {
    reservation: "lookup_reservation",
    check_in: "lookup_reservation",
  },
  widget: {
    welcomeMessage: "Welcome! Ask about your stay, check-in, or hotel amenities.",
    suggestedQuestions: [
      "What time is check-in?",
      "Can I get a late checkout?",
      "Do you have parking?",
    ],
  },
  starterKnowledge: [
    {
      name: "Check-in and check-out",
      content:
        "Standard check-in is 3:00 PM and check-out is 11:00 AM. Early check-in and late checkout are subject to availability and may incur a fee. Guests must present a valid ID and payment method at check-in.",
    },
    {
      name: "Amenities",
      content:
        "Complimentary Wi‑Fi throughout the property. Fitness center open 6 AM–10 PM. Pool hours 8 AM–8 PM. Complimentary breakfast 7–10 AM in the lobby restaurant. Self-parking is available; valet on request.",
    },
    {
      name: "Cancellation policy",
      content:
        "Free cancellation up to 48 hours before arrival. Cancellations within 48 hours may be charged one night. No-shows are charged the full stay. Modifications depend on availability.",
    },
  ],
  workflowTemplates: [
    {
      name: "Late checkout request",
      description: "Create ticket for late checkout when guest asks",
      trigger: "intent_classified",
      conditions: { intent: "late_checkout" },
      actions: { type: "create_ticket", priority: "MEDIUM" },
      priority: 5,
    },
    {
      name: "VIP escalation",
      description: "Escalate angry guests with high urgency",
      trigger: "intent_classified",
      conditions: { sentiment: "angry", urgency: "high" },
      actions: { type: "escalate_to_human" },
      priority: 10,
    },
  ],
  connectors: ["mock-pms"],
};

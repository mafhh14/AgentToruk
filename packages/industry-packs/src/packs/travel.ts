import type { IndustryPack } from "../types";

export const travelPack: IndustryPack = {
  id: "travel-standard",
  industry: "travel",
  name: "Travel — Bookings & Itineraries",
  description:
    "Support for booking lookup, changes, cancellations, and itinerary questions.",
  intents: [
    "booking_lookup",
    "booking_change",
    "itinerary",
    "cancellation",
    "baggage",
    "visa_docs",
  ],
  intentPromptAddon: `
Additional travel intents (use when applicable):
- booking_lookup: find reservation by reference or email
- booking_change: date change, route change, seat upgrade
- itinerary: flight times, connections, hotel segments
- cancellation: cancel trip or request refund
- baggage: bags, weight limits, lost luggage
- visa_docs: travel documents, entry requirements`,
  personality:
    "You are a knowledgeable travel support agent. Be clear about policies and never guarantee refunds or schedule changes without system confirmation.",
  businessDescription:
    "We help travelers with bookings, itinerary questions, changes, and cancellations.",
  tone: "clear and reassuring",
  allowedActions: [
    "search_knowledge_base",
    "lookup_booking",
    "create_ticket",
    "escalate_to_human",
  ],
  ticketIntents: [
    "booking_change",
    "cancellation",
    "complaint",
    "baggage",
    "refund",
    "billing",
  ],
  lookupIntentTools: {
    booking_lookup: "lookup_booking",
    itinerary: "lookup_booking",
    booking_change: "lookup_booking",
  },
  widget: {
    welcomeMessage: "Hi! I can help with your booking, itinerary, or travel questions.",
    suggestedQuestions: [
      "Where is my booking confirmation?",
      "Can I change my travel dates?",
      "What is your cancellation policy?",
    ],
  },
  starterKnowledge: [
    {
      name: "Booking changes",
      content:
        "Date and route changes depend on fare rules. Change fees may apply. Same-day changes require agent review. The AI cannot confirm changes without lookup_booking results.",
    },
    {
      name: "Cancellation and refunds",
      content:
        "Refundable fares cancel to original payment within 7–14 business days. Non-refundable fares may offer travel credit only. Airline schedule changes may qualify for free rebooking.",
    },
    {
      name: "Baggage",
      content:
        "Standard economy includes one carry-on and one personal item. Checked bag fees vary by route. Lost baggage claims must be filed within 24 hours of arrival.",
    },
  ],
  workflowTemplates: [
    {
      name: "Booking change ticket",
      description: "Route booking changes to agents",
      trigger: "intent_classified",
      conditions: { intent: "booking_change" },
      actions: { type: "create_ticket", priority: "HIGH" },
      priority: 8,
    },
    {
      name: "Same-day travel escalation",
      description: "Escalate urgent same-day travel issues",
      trigger: "intent_classified",
      conditions: { urgency: "high", intent: "itinerary" },
      actions: { type: "escalate_to_human" },
      priority: 10,
    },
  ],
  connectors: ["mock-booking-api"],
};

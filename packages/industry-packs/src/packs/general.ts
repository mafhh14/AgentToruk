import type { IndustryPack } from "../types";

export const generalSupportPack: IndustryPack = {
  id: "general-support",
  industry: "general",
  name: "General Support",
  description: "Default customer support for SaaS, services, and general inquiries.",
  intents: [],
  intentPromptAddon: "",
  personality:
    "You are a helpful, professional customer support agent. Be concise and empathetic.",
  businessDescription: "We help customers with product questions, billing, and technical issues.",
  tone: "professional",
  allowedActions: [
    "search_knowledge_base",
    "create_ticket",
    "escalate_to_human",
  ],
  ticketIntents: [
    "billing",
    "refund",
    "technical",
    "complaint",
    "order_status",
  ],
  lookupIntentTools: {},
  widget: {
    welcomeMessage: "Hi! How can I help you today?",
    suggestedQuestions: [
      "How do I reset my password?",
      "What is your refund policy?",
      "I need to talk to a person",
    ],
  },
  starterKnowledge: [
    {
      name: "Support hours",
      content:
        "Support is available Monday–Friday, 9 AM–6 PM local time. Emergency escalations are reviewed within 4 hours.",
    },
    {
      name: "Refund policy",
      content:
        "Refunds are considered within 30 days of purchase for eligible plans. The agent cannot approve refunds directly; requests are reviewed by the billing team.",
    },
  ],
  workflowTemplates: [
    {
      name: "High-risk escalation",
      description: "Escalate high-risk intents to human agents",
      trigger: "intent_classified",
      conditions: { riskLevel: "high" },
      actions: { type: "escalate_to_human" },
      priority: 10,
    },
  ],
  connectors: [],
};

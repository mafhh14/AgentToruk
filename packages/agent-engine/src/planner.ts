import type { AgentPlan, IndustryPlanContext, IntentAnalysis } from "./types";
import { detectHumanRequest } from "./guardrails";

const DEFAULT_TICKET_INTENTS = [
  "billing",
  "refund",
  "technical",
  "complaint",
  "order_status",
];

export function buildPlan(
  intent: IntentAnalysis,
  userMessage: string,
  allowedActions: string[],
  industry?: IndustryPlanContext,
): AgentPlan {
  const tools: AgentPlan["tools"] = [];
  const isAllowed = (name: string) =>
    allowedActions.length === 0 || allowedActions.includes(name);

  const ticketIntents = industry?.ticketIntents?.length
    ? industry.ticketIntents
    : DEFAULT_TICKET_INTENTS;

  if (
    (intent.requiresHuman ||
      intent.intent === "human_request" ||
      detectHumanRequest(userMessage)) &&
    isAllowed("escalate_to_human")
  ) {
    return {
      tools: [{ name: "escalate_to_human", arguments: { reason: intent.summary } }],
      reasoning: "User requested or requires human support",
    };
  }

  const lookupTool = industry?.lookupIntentTools?.[intent.intent];
  if (lookupTool && isAllowed(lookupTool)) {
    tools.push({
      name: lookupTool,
      arguments: {
        query: userMessage,
        confirmation_number: extractConfirmationNumber(userMessage),
        booking_reference: extractConfirmationNumber(userMessage),
      },
    });
  }

  if (isAllowed("search_knowledge_base")) {
    tools.push({
      name: "search_knowledge_base",
      arguments: { query: userMessage },
    });
  }

  if (ticketIntents.includes(intent.intent) && isAllowed("create_ticket")) {
    tools.push({
      name: "create_ticket",
      arguments: {
        title: `${intent.intent.replace("_", " ")}: ${intent.summary.slice(0, 80)}`,
        description: userMessage,
        priority:
          intent.urgency === "high"
            ? "HIGH"
            : intent.urgency === "medium"
              ? "MEDIUM"
              : "LOW",
        intent: intent.intent,
      },
    });
  }

  if (
    intent.riskLevel === "high" &&
    isAllowed("escalate_to_human")
  ) {
    tools.push({
      name: "escalate_to_human",
      arguments: { reason: "High-risk request" },
    });
  }

  return {
    tools,
    reasoning: `Plan for intent=${intent.intent}, urgency=${intent.urgency}`,
  };
}

function extractConfirmationNumber(message: string): string | undefined {
  const match = message.match(/\b([A-Z]{2,6}-?\d{4,8}|\d{6,12})\b/i);
  return match?.[1];
}

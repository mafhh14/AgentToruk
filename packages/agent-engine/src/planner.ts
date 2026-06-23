import type { AgentPlan, IntentAnalysis } from "./types";
import { detectHumanRequest } from "./guardrails";

export function buildPlan(
  intent: IntentAnalysis,
  userMessage: string,
  allowedActions: string[],
): AgentPlan {
  const tools: AgentPlan["tools"] = [];
  const isAllowed = (name: string) =>
    allowedActions.length === 0 || allowedActions.includes(name);

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

  if (isAllowed("search_knowledge_base")) {
    tools.push({
      name: "search_knowledge_base",
      arguments: { query: userMessage },
    });
  }

  if (
    ["billing", "refund", "technical", "complaint", "order_status"].includes(
      intent.intent,
    ) &&
    isAllowed("create_ticket")
  ) {
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

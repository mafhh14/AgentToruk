import type { ChatMessage } from "@agenttoruk/shared";
import type { LlmProvider } from "@agenttoruk/llm";
import type { IntentAnalysis, IntentCategory } from "./types";

const INTENT_PROMPT = `Analyze the customer support message. Reply with ONLY valid JSON:
{
  "intent": "faq|billing|refund|order_status|technical|appointment|complaint|human_request|general",
  "urgency": "low|medium|high",
  "sentiment": "neutral|frustrated|angry",
  "risk_level": "low|medium|high",
  "requires_human": false,
  "missing_entities": [],
  "summary": "one sentence"
}

Rules:
- intent "human_request" if they want a person
- urgency "high" for angry + blocking issues
- risk_level "high" for refunds, legal, account deletion
- requires_human true for explicit human request or legal threats`;

export async function classifyIntent(
  llm: LlmProvider,
  model: string,
  userMessage: string,
  history: ChatMessage[],
): Promise<IntentAnalysis> {
  const recent = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");

  try {
    const response = await llm.chat({
      model,
      messages: [
        { role: "system", content: INTENT_PROMPT },
        {
          role: "user",
          content: `Conversation:\n${recent}\n\nLatest message: ${userMessage}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 300,
    });

    const parsed = parseIntentJson(response.content);
    if (parsed) return parsed;
  } catch {
    // fallback below
  }

  return ruleBasedIntent(userMessage);
}

function parseIntentJson(text: string): IntentAnalysis | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      intent: normalizeIntent(String(raw.intent ?? "general")),
      urgency: normalizeUrgency(String(raw.urgency ?? "low")),
      sentiment: normalizeSentiment(String(raw.sentiment ?? "neutral")),
      riskLevel: normalizeRisk(String(raw.risk_level ?? "low")),
      requiresHuman: Boolean(raw.requires_human),
      missingEntities: Array.isArray(raw.missing_entities)
        ? raw.missing_entities.map(String)
        : [],
      summary: String(raw.summary ?? userMessageFallback(text)),
    };
  } catch {
    return null;
  }
}

function userMessageFallback(_text: string): string {
  return "Customer support inquiry";
}

function normalizeIntent(value: string): IntentCategory {
  const valid: IntentCategory[] = [
    "faq",
    "billing",
    "refund",
    "order_status",
    "technical",
    "appointment",
    "complaint",
    "human_request",
    "general",
  ];
  return valid.includes(value as IntentCategory)
    ? (value as IntentCategory)
    : "general";
}

function normalizeUrgency(value: string): IntentAnalysis["urgency"] {
  return value === "high" || value === "medium" ? value : "low";
}

function normalizeSentiment(value: string): IntentAnalysis["sentiment"] {
  if (value === "angry" || value === "frustrated") return value;
  return "neutral";
}

function normalizeRisk(value: string): IntentAnalysis["riskLevel"] {
  if (value === "high" || value === "medium") return value;
  return "low";
}

function ruleBasedIntent(message: string): IntentAnalysis {
  const lower = message.toLowerCase();

  let intent: IntentCategory = "general";
  if (/\b(human|agent|person|representative)\b/.test(lower)) {
    intent = "human_request";
  } else if (/\b(refund|money back)\b/.test(lower)) {
    intent = "refund";
  } else if (/\b(bill|charge|payment|invoice)\b/.test(lower)) {
    intent = "billing";
  } else if (/\b(order|shipping|delivery|track)\b/.test(lower)) {
    intent = "order_status";
  } else if (/\b(bug|error|broken|not working)\b/.test(lower)) {
    intent = "technical";
  } else if (/\b(appointment|book|schedule|demo)\b/.test(lower)) {
    intent = "appointment";
  } else if (/\b(angry|terrible|awful|upset|frustrated)\b/.test(lower)) {
    intent = "complaint";
  } else if (/\b(how|what|when|where|policy|help)\b/.test(lower)) {
    intent = "faq";
  }

  const sentiment: IntentAnalysis["sentiment"] =
    /\b(angry|furious|terrible|awful)\b/.test(lower)
      ? "angry"
      : /\b(frustrated|upset|annoyed)\b/.test(lower)
        ? "frustrated"
        : "neutral";

  const urgency: IntentAnalysis["urgency"] =
    sentiment === "angry" ? "high" : sentiment === "frustrated" ? "medium" : "low";

  const riskLevel: IntentAnalysis["riskLevel"] =
    intent === "refund" || intent === "billing" ? "medium" : "low";

  return {
    intent,
    urgency,
    sentiment,
    riskLevel,
    requiresHuman: intent === "human_request",
    missingEntities: [],
    summary: message.slice(0, 120),
  };
}

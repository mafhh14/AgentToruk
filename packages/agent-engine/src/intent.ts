import type { ChatMessage } from "@agenttoruk/shared";
import type { LlmProvider } from "@agenttoruk/llm";
import type { IntentAnalysis, IntentCategory } from "./types";

const BASE_INTENTS =
  "faq|billing|refund|order_status|technical|appointment|complaint|human_request|general";

const BASE_INTENT_LIST: IntentCategory[] = [
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

function buildIntentPrompt(extraIntents: string[] = [], addon = ""): string {
  const allIntents =
    extraIntents.length > 0
      ? `${BASE_INTENTS}|${extraIntents.join("|")}`
      : BASE_INTENTS;

  return `Analyze the customer support message. Reply with ONLY valid JSON:
{
  "intent": "${allIntents}",
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
- requires_human true for explicit human request or legal threats${addon ? `\n${addon}` : ""}`;
}

export async function classifyIntent(
  llm: LlmProvider,
  model: string,
  userMessage: string,
  history: ChatMessage[],
  options?: { extraIntents?: string[]; intentPromptAddon?: string },
): Promise<IntentAnalysis> {
  const extraIntents = options?.extraIntents ?? [];
  const intentPrompt = buildIntentPrompt(extraIntents, options?.intentPromptAddon);
  const recent = history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");

  try {
    const response = await llm.chat({
      model,
      messages: [
        { role: "system", content: intentPrompt },
        {
          role: "user",
          content: `Conversation:\n${recent}\n\nLatest message: ${userMessage}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 300,
    });

    const parsed = parseIntentJson(response.content, extraIntents);
    if (parsed) return parsed;
  } catch {
    // fallback below
  }

  return ruleBasedIntent(userMessage, extraIntents);
}

function parseIntentJson(
  text: string,
  extraIntents: string[],
): IntentAnalysis | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      intent: normalizeIntent(String(raw.intent ?? "general"), extraIntents),
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

function normalizeIntent(
  value: string,
  extraIntents: string[] = [],
): IntentCategory {
  if (extraIntents.includes(value)) {
    return value as IntentCategory;
  }
  return BASE_INTENT_LIST.includes(value as IntentCategory)
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

function ruleBasedIntent(
  message: string,
  extraIntents: string[] = [],
): IntentAnalysis {
  const lower = message.toLowerCase();

  let intent: IntentCategory = "general";
  if (/\b(human|agent|person|representative)\b/.test(lower)) {
    intent = "human_request";
  } else if (extraIntents.includes("reservation") && /\b(reservation|booking|confirm)\b/.test(lower)) {
    intent = "reservation";
  } else if (extraIntents.includes("check_in") && /\b(check.?in|arrival|early check)\b/.test(lower)) {
    intent = "check_in";
  } else if (extraIntents.includes("late_checkout") && /\b(late checkout|extend checkout)\b/.test(lower)) {
    intent = "late_checkout";
  } else if (extraIntents.includes("room_service") && /\b(room service|housekeeping|towels|maintenance)\b/.test(lower)) {
    intent = "room_service";
  } else if (extraIntents.includes("amenities") && /\b(pool|gym|breakfast|parking|wifi|amenit)/.test(lower)) {
    intent = "amenities";
  } else if (extraIntents.includes("booking_lookup") && /\b(booking|confirmation|reference|pnr)\b/.test(lower)) {
    intent = "booking_lookup";
  } else if (extraIntents.includes("booking_change") && /\b(change|reschedule|modify).*(date|flight|trip)/.test(lower)) {
    intent = "booking_change";
  } else if (extraIntents.includes("itinerary") && /\b(itinerary|flight|connection|departure)\b/.test(lower)) {
    intent = "itinerary";
  } else if (extraIntents.includes("baggage") && /\b(baggage|luggage|suitcase|lost bag)\b/.test(lower)) {
    intent = "baggage";
  } else if (/\b(cancel|cancellation)\b/.test(lower)) {
    intent = extraIntents.includes("cancellation") ? "cancellation" : "refund";
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

import type {
  AgentContext,
  AgentResult,
  ChatMessage,
  LlmProviderName,
  RagChunk,
  RagProviderName,
} from "@agenttoruk/shared";
import { createLlmProvider } from "@agenttoruk/llm";
import {
  checkInputGuardrails,
  checkOutputGuardrails,
  detectHumanRequest,
} from "./guardrails";
import { classifyIntent } from "./intent";
import { buildPlan } from "./planner";
import type {
  IntentAnalysis,
  IndustryPlanContext,
  OrchestratorLogSink,
  ToolExecutionResult,
  ToolRuntime,
} from "./types";

export interface OrchestratorConfig {
  llmProvider: LlmProviderName;
  llmModel: string;
  ragProvider: RagProviderName;
  openaiApiKey?: string;
  geminiApiKey?: string;
  systemPrompt: string;
  agentName?: string;
  tone?: string;
  fallbackMessage: string;
  confidenceThreshold: number;
  allowedActions: string[];
  restrictedActions: string[];
  toolRuntime?: ToolRuntime;
  logSink?: OrchestratorLogSink;
  industryIntents?: string[];
  intentPromptAddon?: string;
  industryPlan?: IndustryPlanContext;
}

export class AgentOrchestrator {
  constructor(private readonly config: OrchestratorConfig) {}

  async processMessage(
    context: AgentContext,
    userMessage: string,
  ): Promise<AgentResult> {
    const stages: AgentResult["stages"] = [];
    const actionsTaken: string[] = [];
    let sources: RagChunk[] = [];

    const logStage = async (
      stage: string,
      input?: Record<string, unknown>,
      output?: Record<string, unknown>,
      startMs?: number,
    ) => {
      const durationMs = startMs ? Date.now() - startMs : undefined;
      stages.push({ stage, input, output, durationMs });
      await this.config.logSink?.log(stage, { input, output }, durationMs);
    };

    const t0 = Date.now();
    const guardrail = checkInputGuardrails(userMessage);
    await logStage("guardrails_input", { message: userMessage }, guardrail, t0);

    if (!guardrail.allowed) {
      return {
        response: guardrail.message!,
        confidence: 1,
        handoff: false,
        stages,
        actionsTaken,
      };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        response: this.config.fallbackMessage,
        confidence: 0.4,
        handoff: false,
        stages,
        actionsTaken,
      };
    }

    const llm = createLlmProvider(this.config.llmProvider, { apiKey });

    const t1 = Date.now();
    const intent = await classifyIntent(
      llm,
      this.config.llmModel,
      userMessage,
      context.messages,
      {
        extraIntents: this.config.industryIntents,
        intentPromptAddon: this.config.intentPromptAddon,
      },
    );
    await logStage("understand", { userMessage }, intent as unknown as Record<string, unknown>, t1);

    if (
      intent.requiresHuman ||
      intent.intent === "human_request" ||
      detectHumanRequest(userMessage)
    ) {
      await this.runTool("escalate_to_human", { reason: intent.summary }, context, actionsTaken);
      return {
        response:
          "I'm connecting you with a human support agent. Someone from our team will join this chat shortly.",
        confidence: 0.95,
        handoff: true,
        handoffReason: "User requested human support",
        intent: intent.intent,
        sentiment: intent.sentiment,
        urgency: intent.urgency,
        stages,
        actionsTaken,
      };
    }

    const t2 = Date.now();
    const plan = buildPlan(
      intent,
      userMessage,
      this.getEffectiveAllowedActions(),
      this.config.industryPlan,
    );
    await logStage("plan", { intent: intent.intent }, plan as unknown as Record<string, unknown>, t2);

    const toolResults: ToolExecutionResult[] = [];
    for (const planned of plan.tools) {
      if (this.isRestricted(planned.name)) continue;
      const result = await this.runTool(
        planned.name,
        planned.arguments,
        context,
        actionsTaken,
      );
      toolResults.push(result);
      if (planned.name === "search_knowledge_base" && result.success) {
        const chunks = result.output.chunks as RagChunk[] | undefined;
        if (chunks?.length) sources = chunks;
      }
      if (planned.name === "escalate_to_human" && result.success) {
        return {
          response:
            "I've escalated this to our support team. A human agent will assist you shortly.",
          confidence: 0.9,
          handoff: true,
          handoffReason: String(planned.arguments.reason ?? "Escalation triggered"),
          intent: intent.intent,
          sentiment: intent.sentiment,
          urgency: intent.urgency,
          sources,
          stages,
          actionsTaken,
        };
      }
    }

    const t3 = Date.now();
    const response = await this.generateResponse(
      llm,
      context,
      userMessage,
      intent,
      toolResults,
      sources,
    );
    await logStage("generate", undefined, { length: response.text.length }, t3);

    const safeText = checkOutputGuardrails(response.text);
    const confidence = this.computeConfidence(intent, toolResults, sources);

    const handoff =
      confidence < this.config.confidenceThreshold ||
      (intent.sentiment === "angry" && intent.urgency === "high" && confidence < 0.75);

    let handoffReason: string | undefined;
    if (handoff) {
      handoffReason =
        confidence < this.config.confidenceThreshold
          ? "Low confidence response"
          : "High urgency frustrated customer";
      if (this.config.toolRuntime && !actionsTaken.includes("escalate_to_human")) {
        await this.runTool(
          "escalate_to_human",
          { reason: handoffReason },
          context,
          actionsTaken,
        );
      }
    }

    return {
      response: safeText,
      confidence,
      handoff,
      handoffReason,
      sources: sources.length ? sources : undefined,
      intent: intent.intent,
      sentiment: intent.sentiment,
      urgency: intent.urgency,
      stages,
      actionsTaken,
    };
  }

  private getApiKey(): string | undefined {
    return this.config.llmProvider === "openai"
      ? this.config.openaiApiKey
      : this.config.geminiApiKey;
  }

  private getEffectiveAllowedActions(): string[] {
    const defaults = [
      "search_knowledge_base",
      "create_ticket",
      "escalate_to_human",
    ];
    const allowed =
      this.config.allowedActions.length > 0
        ? this.config.allowedActions
        : defaults;
    return allowed.filter((a) => !this.config.restrictedActions.includes(a));
  }

  private isRestricted(toolName: string): boolean {
    return this.config.restrictedActions.includes(toolName);
  }

  private async runTool(
    name: string,
    args: Record<string, unknown>,
    context: AgentContext,
    actionsTaken: string[],
  ): Promise<ToolExecutionResult> {
    if (!this.config.toolRuntime) {
      return { success: false, toolName: name, output: {}, error: "No tool runtime" };
    }
    const result = await this.config.toolRuntime.execute(name, args, context);
    if (result.success) actionsTaken.push(name);
    return result;
  }

  private async generateResponse(
    llm: ReturnType<typeof createLlmProvider>,
    context: AgentContext,
    userMessage: string,
    intent: IntentAnalysis,
    toolResults: ToolExecutionResult[],
    sources: RagChunk[],
  ): Promise<{ text: string }> {
    const kbContext = sources.length
      ? `\n\nKnowledge base results:\n${sources.map((s, i) => `[${i + 1}] ${s.documentName}: ${s.content}`).join("\n")}\nCite sources as [1], [2] when used.`
      : "";

    const toolContext = toolResults.length
      ? `\n\nTool results:\n${toolResults.map((t) => `${t.toolName}: ${JSON.stringify(t.output)}`).join("\n")}`
      : "";

    const ticketCreated = toolResults.some(
      (t) => t.toolName === "create_ticket" && t.success,
    );

    const systemContent = `${this.config.systemPrompt}

Agent name: ${this.config.agentName ?? "Support Agent"}
Tone: ${this.config.tone ?? "professional"}

Current analysis:
- Intent: ${intent.intent}
- Sentiment: ${intent.sentiment}
- Urgency: ${intent.urgency}

Rules:
- Only answer from knowledge base context when provided; if missing, say you don't have that information
- Do not promise refunds or approvals unless a tool confirms it
- Be concise (2-4 sentences unless more detail is needed)
- If a ticket was created, mention the ticket ID to the customer
${ticketCreated ? "- A support ticket was created — inform the customer with the ticket number" : ""}
${kbContext}${toolContext}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...context.messages,
      { role: "user", content: userMessage },
    ];

    const response = await llm.chat({
      model: this.config.llmModel,
      messages,
      temperature: 0.6,
      maxTokens: 600,
    });

    return { text: response.content || this.config.fallbackMessage };
  }

  private computeConfidence(
    intent: IntentAnalysis,
    toolResults: ToolExecutionResult[],
    sources: RagChunk[],
  ): number {
    let score = 0.75;

    const kb = toolResults.find((t) => t.toolName === "search_knowledge_base");
    if (kb?.success && sources.length > 0) {
      const topScore = Math.max(...sources.map((s) => s.score));
      score = 0.65 + topScore * 0.3;
    } else if (intent.intent === "faq") {
      score = 0.45;
    }

    if (toolResults.some((t) => t.toolName === "create_ticket" && t.success)) {
      score += 0.1;
    }

    if (intent.riskLevel === "high") score -= 0.15;
    if (intent.sentiment === "angry") score -= 0.1;

    return Math.max(0.1, Math.min(0.98, score));
  }
}

// Backward-compatible alias
export { AgentOrchestrator as AgentEngine };

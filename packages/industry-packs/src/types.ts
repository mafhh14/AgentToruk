export type IndustryType =
  | "general"
  | "hospitality"
  | "travel"
  | "ecommerce"
  | "saas";

export interface StarterKnowledgeDoc {
  name: string;
  content: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  trigger: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
}

export interface IndustryPack {
  id: string;
  industry: IndustryType;
  name: string;
  description: string;
  intents: string[];
  intentPromptAddon: string;
  personality: string;
  businessDescription: string;
  tone: string;
  allowedActions: string[];
  ticketIntents: string[];
  lookupIntentTools: Record<string, string>;
  widget: {
    welcomeMessage: string;
    suggestedQuestions: string[];
  };
  starterKnowledge: StarterKnowledgeDoc[];
  workflowTemplates: WorkflowTemplate[];
  connectors: string[];
}

export interface IntegrationConnector {
  id: string;
  name: string;
  description: string;
  industries: IndustryType[];
  status: "mock" | "beta" | "planned";
}

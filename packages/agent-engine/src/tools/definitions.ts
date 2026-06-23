import type { ToolDefinition } from "@agenttoruk/shared";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "search_knowledge_base",
    description:
      "Search the company knowledge base for relevant documentation, policies, and FAQs.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "create_ticket",
    description:
      "Create a support ticket for issues that need human follow-up.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
        intent: { type: "string" },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Escalate the conversation to a human support agent when AI cannot help.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

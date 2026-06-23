import { TOOL_DEFINITIONS } from "./definitions";

export { TOOL_DEFINITIONS };

export function getToolDefinitions(allowedActions: string[]) {
  if (allowedActions.length === 0) return TOOL_DEFINITIONS;
  return TOOL_DEFINITIONS.filter((t) => allowedActions.includes(t.name));
}

import type { ConversationStatus } from "@agenttoruk/database";

export function formatConversationStatus(status: ConversationStatus): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function statusBadgeClass(status: ConversationStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "ESCALATED":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "RESOLVED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "CLOSED":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function formatMessageTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function roleLabel(role: string): string {
  switch (role) {
    case "USER":
      return "Visitor";
    case "ASSISTANT":
      return "AI Agent";
    case "HUMAN":
      return "Support";
    case "SYSTEM":
      return "System";
    default:
      return role;
  }
}

import type { TicketPriority, TicketStatus } from "@agenttoruk/database";

export function formatTicketStatus(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In Progress";
    case "WAITING_FOR_CUSTOMER":
      return "Waiting for Customer";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

export function formatTicketPriority(priority: TicketPriority): string {
  switch (priority) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "URGENT":
      return "Urgent";
    default:
      return priority;
  }
}

export function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "WAITING_FOR_CUSTOMER":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
    case "RESOLVED":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "CLOSED":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function priorityBadgeClass(priority: TicketPriority): string {
  switch (priority) {
    case "LOW":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    case "MEDIUM":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "HIGH":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    case "URGENT":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function formatTicketTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

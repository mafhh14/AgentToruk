import type { MembershipRole } from "@agenttoruk/database";

export type Permission =
  | "dashboard:read"
  | "conversations:read"
  | "conversations:write"
  | "tickets:read"
  | "tickets:write"
  | "knowledge:read"
  | "knowledge:write"
  | "agent:read"
  | "agent:write"
  | "workflows:read"
  | "workflows:write"
  | "analytics:read"
  | "team:read"
  | "team:write"
  | "settings:read"
  | "settings:write";

const ROLE_PERMISSIONS: Record<MembershipRole, Permission[] | "*"> = {
  OWNER: "*",
  ADMIN: [
    "dashboard:read",
    "conversations:read",
    "conversations:write",
    "tickets:read",
    "tickets:write",
    "knowledge:read",
    "knowledge:write",
    "agent:read",
    "agent:write",
    "workflows:read",
    "workflows:write",
    "analytics:read",
    "team:read",
    "team:write",
    "settings:read",
    "settings:write",
  ],
  SUPPORT_AGENT: [
    "dashboard:read",
    "conversations:read",
    "conversations:write",
    "tickets:read",
    "tickets:write",
    "knowledge:read",
    "analytics:read",
  ],
  VIEWER: [
    "dashboard:read",
    "conversations:read",
    "tickets:read",
    "knowledge:read",
    "analytics:read",
    "team:read",
  ],
};

export function hasPermission(
  role: MembershipRole,
  permission: Permission,
): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms === "*") return true;
  return perms.includes(permission);
}

export function canManageTeam(role: MembershipRole): boolean {
  return hasPermission(role, "team:write");
}

export function formatRole(role: MembershipRole): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

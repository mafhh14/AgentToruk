"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Settings,
  Ticket,
  Users,
  Workflow,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatRole, hasPermission } from "@/lib/rbac";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" as const },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare, permission: "conversations:read" as const },
  { href: "/dashboard/handoff", label: "Live handoff", icon: Headphones, permission: "conversations:read" as const },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket, permission: "tickets:read" as const },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen, permission: "knowledge:read" as const },
  { href: "/dashboard/industry", label: "Industry", icon: Building2, permission: "settings:read" as const },
  { href: "/dashboard/widget", label: "Widget", icon: Palette, permission: "settings:read" as const },
  { href: "/dashboard/agent", label: "Agent", icon: Bot, permission: "agent:read" as const },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow, permission: "workflows:read" as const },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, permission: "analytics:read" as const },
  { href: "/dashboard/team", label: "Team", icon: Users, permission: "team:read" as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "settings:read" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role;
  const visibleNav = navItems.filter(
    (item) => role && hasPermission(role, item.permission),
  );

  return (
    <aside className="flex w-64 flex-col border-r border-slate-800 bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Bot className="h-6 w-6 text-blue-400" />
        <span className="font-semibold">AgentToruk</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--sidebar-active)] text-white"
                  : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-active)] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="truncate text-sm font-medium text-white">
            {session?.user?.organizationName ?? "Organization"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {session?.user?.name ?? session?.user?.email}
            {session?.user?.role && ` · ${formatRole(session.user.role)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

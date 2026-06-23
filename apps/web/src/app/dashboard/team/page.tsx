"use client";

import type { MembershipRole } from "@agenttoruk/database";
import { PageHeader } from "@/components/layout/page-header";
import { canManageTeam, formatRole } from "@/lib/rbac";
import { Loader2, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface TeamMember {
  id: string;
  role: MembershipRole;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>("SUPPORT_AGENT");

  const canInvite = session?.user?.role && canManageTeam(session.user.role);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = (await res.json()) as { members: TeamMember[] };
        setMembers(data.members);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInviting(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to invite member");
        return;
      }

      setInviteEmail("");
      setInviteName("");
      setInviteRole("SUPPORT_AGENT");
      setShowInvite(false);
      await loadMembers();
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Invite members and manage roles and permissions."
        action={
          canInvite ? (
            <button
              type="button"
              onClick={() => setShowInvite(!showInvite)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Invite member
            </button>
          ) : undefined
        }
      />

      {showInvite && canInvite && (
        <form
          onSubmit={handleInvite}
          className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
        >
          <h2 className="font-semibold">Invite team member</h2>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <input
              type="email"
              placeholder="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Name (new users)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MembershipRole)}
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            >
              <option value="SUPPORT_AGENT">Support Agent</option>
              <option value="VIEWER">Viewer</option>
              {session?.user?.role === "OWNER" && (
                <option value="ADMIN">Admin</option>
              )}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send invite
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : members.length === 0 ? (
          <p className="p-12 text-center text-sm text-[var(--muted)]">
            No team members found.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-6 py-4 font-medium">
                    {member.user.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {member.user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs">
                      {formatRole(member.role)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

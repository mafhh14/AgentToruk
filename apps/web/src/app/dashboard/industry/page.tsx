import { PageHeader } from "@/components/layout/page-header";
import { IndustryPackSelector } from "@/components/industry/industry-pack-selector";
import { hasPermission } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function IndustryPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const canWrite =
    session.user.role && hasPermission(session.user.role, "settings:write");

  return (
    <div>
      <PageHeader
        title="Industry packs"
        description="Choose a vertical template for hospitality, travel, or general support. Applies agent personality, widget copy, starter knowledge, and workflows."
      />
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <IndustryPackSelector canWrite={Boolean(canWrite)} />
      </section>
    </div>
  );
}

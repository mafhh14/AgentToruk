import { PageHeader } from "@/components/layout/page-header";
import { HandoffQueue } from "@/components/handoff/handoff-queue";

export default function HandoffPage() {
  return (
    <div>
      <PageHeader
        title="Live handoff queue"
        description="Escalated chats waiting for a human agent. Claim a conversation to respond in real time."
      />
      <HandoffQueue />
    </div>
  );
}

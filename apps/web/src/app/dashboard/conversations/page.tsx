import { PageHeader } from "@/components/layout/page-header";
import { ConversationsList } from "@/components/conversations/conversations-list";

export default function ConversationsPage() {
  return (
    <div>
      <PageHeader
        title="Conversations"
        description="View and manage all customer chat sessions."
      />
      <ConversationsList />
    </div>
  );
}

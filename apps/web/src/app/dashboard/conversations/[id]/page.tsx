import { ConversationDetailView } from "@/components/conversations/conversation-detail";

export default function ConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ConversationDetailView conversationId={params.id} />;
}

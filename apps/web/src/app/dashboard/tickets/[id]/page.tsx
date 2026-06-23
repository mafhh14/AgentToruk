import { TicketDetailView } from "@/components/tickets/ticket-detail";

export default function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <TicketDetailView ticketId={params.id} />;
}

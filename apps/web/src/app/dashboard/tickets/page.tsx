import { PageHeader } from "@/components/layout/page-header";
import { TicketsList } from "@/components/tickets/tickets-list";

export default function TicketsPage() {
  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Track support issues created from chat escalations or manually."
      />
      <TicketsList />
    </div>
  );
}

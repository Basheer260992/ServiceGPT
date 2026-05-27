import { TicketListPage } from './TicketList';

export default function IncidentsPage() {
  return (
    <TicketListPage
      kind="incidents"
      title="Incident Management"
      subtitle="Track and resolve unplanned interruptions"
      basePath="/incidents"
    />
  );
}

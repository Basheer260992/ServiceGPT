import { TicketListPage } from './TicketList';

export default function ChangesPage() {
  return (
    <TicketListPage
      kind="changes"
      title="Change Request Management"
      subtitle="Plan, assess, and implement infrastructure changes"
      basePath="/changes"
    />
  );
}

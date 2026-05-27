import { TicketListPage } from './TicketList';

export default function ProblemsPage() {
  return (
    <TicketListPage
      kind="problems"
      title="Problem Management"
      subtitle="Identify root causes and prevent recurrence"
      basePath="/problems"
    />
  );
}

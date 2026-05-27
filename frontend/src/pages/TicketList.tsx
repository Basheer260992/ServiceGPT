import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/PageHeader';
import { TicketTable } from '@/components/TicketTable';
import { Modal } from '@/components/Modal';
import { TicketForm } from '@/components/TicketForm';
import { Pagination } from '@/components/Pagination';
import { useTicketStore } from '@/store/ticket.store';
import { useAuthStore } from '@/store/auth.store';
import { useDebounce } from '@/hooks/useDebounce';
import type { TicketKind } from '@/types';

interface Props {
  kind: TicketKind;
  title: string;
  subtitle: string;
  basePath: string;
}

const PRIORITIES = ['Critical', 'High', 'Moderate', 'Low'];

const TOAST_BY_KIND: Record<TicketKind, string> = {
  incidents: 'Incident Created Successfully',
  problems: 'Problem Created Successfully',
  changes: 'Change Request Submitted',
};

const STATES_BY_KIND: Record<TicketKind, string[]> = {
  incidents: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
  problems: ['New', 'Root Cause Analysis', 'Known Error', 'Resolved', 'Closed'],
  changes: ['New', 'Assess', 'Approved', 'Implement', 'Review', 'Closed'],
};

export function TicketListPage({ kind, title, subtitle, basePath }: Props) {
  const [params, setParams] = useSearchParams();
  const initialSearch = params.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [priority, setPriority] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const bucket = useTicketStore((s) => s[kind]);
  const fetchList = useTicketStore((s) => s.fetchList);
  const createTicket = useTicketStore((s) => s.createTicket);
  const user = useAuthStore((s) => s.user);

  const query = useMemo(
    () => ({ search: debouncedSearch || undefined, priority: priority || undefined, state: state || undefined, page, limit: 10 }),
    [debouncedSearch, priority, state, page]
  );

  useEffect(() => {
    fetchList(kind, query);
  }, [fetchList, kind, query]);

  useEffect(() => {
    if (debouncedSearch) params.set('search', debouncedSearch); else params.delete('search');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const submit = async (data: any) => {
    setSubmitting(true);
    try {
      await createTicket(kind, data);
      toast.success(TOAST_BY_KIND[kind]);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const states = STATES_BY_KIND[kind];
  const isEmployee = user?.role === 'employee';
  const displayTitle = isEmployee ? `My ${title.replace(' Management', '')}` : title;
  const displaySubtitle = isEmployee
    ? `Track the status of ${kind === 'changes' ? 'change requests' : kind} you have submitted`
    : subtitle;

  return (
    <div>
      <PageHeader
        title={displayTitle}
        subtitle={displaySubtitle}
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> {kind === 'changes' ? 'New Change' : `New ${kind.slice(0, -1)}`}
          </button>
        }
      />

      <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search number, description, requester…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="input pl-8" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <select className="input" value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
            <option value="">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <TicketTable
          data={bucket.data}
          loading={bucket.loading}
          basePath={basePath}
          showAssignment={!isEmployee}
        />
        <Pagination page={page} total={bucket.total} limit={10} onChange={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Create ${kind === 'changes' ? 'Change Request' : kind.slice(0, -1)}`}>
        <TicketForm
          kind={kind}
          defaultRequestedBy={user?.name || ''}
          lockRequestedBy={isEmployee}
          onSubmit={submit}
          submitting={submitting}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

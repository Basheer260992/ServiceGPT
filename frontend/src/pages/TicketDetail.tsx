import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Check, X as XIcon, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { TicketService } from '@/services/ticket.service';
import { api } from '@/api/client';
import type { Ticket, TicketKind } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { PriorityBadge, StateBadge } from '@/components/Badge';
import { useAuthStore } from '@/store/auth.store';

interface Props {
  kind: TicketKind;
  basePath: string;
}

const STATES_BY_KIND: Record<TicketKind, string[]> = {
  incidents: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
  problems: ['New', 'Root Cause Analysis', 'Known Error', 'Resolved', 'Closed'],
  changes: ['New', 'Assess', 'Approved', 'Implement', 'Review', 'Closed'],
};

export function TicketDetailPage({ kind, basePath }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<'approve' | 'reject' | null>(null);
  const [state, setState] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (!id) return;
    TicketService.get(kind, id)
      .then((t) => { setTicket(t); setState(t.state); setAssignedTo(t.assignedTo || ''); })
      .catch((err) => {
        if (err?.response?.status === 403) {
          toast.error('You can only view your own tickets');
        }
        navigate(basePath);
      })
      .finally(() => setLoading(false));
  }, [id, kind, basePath, navigate]);

  const isEmployee = user?.role === 'employee';
  const isSupport = user?.role === 'support';
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || isSupport;
  const canApprove = isAdmin && kind === 'changes';

  // IT support can't move a change to Approved
  const allowedStates = (STATES_BY_KIND[kind] || []).filter((s) => {
    if (kind === 'changes' && s === 'Approved' && !isAdmin) return false;
    return true;
  });

  const save = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const next = await TicketService.update(kind, ticket.id, { state, assignedTo });
      setTicket(next);
      toast.success('Ticket updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const decide = async (decision: 'approve' | 'reject') => {
    if (!ticket) return;
    setDecisionLoading(decision);
    try {
      const { data } = await api.post(`/changes/${ticket.id}/${decision}`);
      setTicket(data);
      setState(data.state);
      toast.success(decision === 'approve' ? 'Change request approved' : 'Change request rejected');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed');
    } finally {
      setDecisionLoading(null);
    }
  };

  if (loading) {
    return <div className="space-y-3"><div className="skeleton h-8 w-48" /><div className="skeleton h-40 w-full" /></div>;
  }
  if (!ticket) return null;

  const approvalState = (ticket as any).approval as string | undefined;
  const showApprovalSection = canApprove && (ticket.state === 'New' || ticket.state === 'Assess');

  return (
    <div>
      <PageHeader
        title={ticket.number}
        subtitle={ticket.shortDescription}
        actions={
          <button onClick={() => navigate(basePath)} className="btn-secondary">
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Description</div>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{ticket.description || '—'}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Info label="Priority"><PriorityBadge value={ticket.priority} /></Info>
            <Info label="State"><StateBadge value={ticket.state} /></Info>
            <Info label="Category">{ticket.category}</Info>
            <Info label="Impact">{ticket.impact}</Info>
            <Info label="Urgency">{ticket.urgency}</Info>
            <Info label="Assignment Group">{ticket.assignmentGroup}</Info>
            <Info label="Requested By">{ticket.requestedBy}</Info>
            <Info label="Assigned To">{ticket.assignedTo || '—'}</Info>
            <Info label="Created">{new Date(ticket.createdAt).toLocaleString()}</Info>
            {approvalState && <Info label="Approval">{approvalState}</Info>}
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Attachments</div>
              <ul className="space-y-1">
                {ticket.attachments.map((a, i) => (
                  <li key={i} className="text-sm flex justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded">
                    <span>{a.name}</span>
                    <span className="text-slate-500">{(a.size / 1024).toFixed(1)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!canEdit && (
            <div className="card p-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                <Eye size={16} /> View only
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                You can track the status of this ticket. To request an update, contact IT Support or reply via email.
              </p>
            </div>
          )}

          {canEdit && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold">Update ticket</h3>
              <div>
                <label className="label">State</label>
                <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
                  {allowedStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {kind === 'changes' && !isAdmin && (
                  <div className="text-[11px] text-slate-500 mt-1">Only admins can set state to "Approved".</div>
                )}
              </div>
              <div>
                <label className="label">Assigned to</label>
                <input
                  className="input"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Assignee name"
                />
              </div>
              <button onClick={save} className="btn-primary w-full" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {showApprovalSection && (
            <div className="card p-6 space-y-3">
              <h3 className="font-semibold">Change approval</h3>
              <p className="text-xs text-slate-500">As an admin you can approve or reject this change request.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => decide('approve')}
                  className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={decisionLoading !== null}
                >
                  <Check size={14} /> {decisionLoading === 'approve' ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => decide('reject')}
                  className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
                  disabled={decisionLoading !== null}
                >
                  <XIcon size={14} /> {decisionLoading === 'reject' ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-slate-800 dark:text-slate-100 mt-1">{children}</div>
    </div>
  );
}

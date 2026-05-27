import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import type { Ticket } from '@/types';
import { PriorityBadge, StateBadge } from './Badge';

interface Props {
  data: Ticket[];
  loading?: boolean;
  basePath: string;
  empty?: string;
  showAssignment?: boolean;
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function TicketTable({ data, loading, basePath, empty = 'No tickets to show', showAssignment = true }: Props) {
  if (loading) {
    return (
      <div className="space-y-1 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-14 text-center">
        <div className="mx-auto w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 grid place-items-center mb-3">
          <Inbox size={18} />
        </div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{empty}</div>
        <div className="text-xs text-slate-500 mt-0.5">New tickets will appear here.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <th className="px-4 py-2.5 font-semibold">Number</th>
            <th className="px-4 py-2.5 font-semibold">Short Description</th>
            <th className="px-4 py-2.5 font-semibold">Priority</th>
            <th className="px-4 py-2.5 font-semibold">State</th>
            <th className="px-4 py-2.5 font-semibold">Category</th>
            {showAssignment && <th className="px-4 py-2.5 font-semibold">Assigned To</th>}
            <th className="px-4 py-2.5 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {data.map((t) => (
            <tr key={t.id} className="table-row">
              <td className="px-4 py-2.5 font-mono text-xs">
                <Link to={`${basePath}/${t.number}`} className="text-brand-600 hover:text-brand-700 font-semibold">
                  {t.number}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-slate-800 dark:text-slate-100 max-w-md truncate">
                <Link to={`${basePath}/${t.number}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                  {t.shortDescription}
                </Link>
              </td>
              <td className="px-4 py-2.5"><PriorityBadge value={t.priority} /></td>
              <td className="px-4 py-2.5"><StateBadge value={t.state} /></td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{t.category}</td>
              {showAssignment && (
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                  {t.assignedTo ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] grid place-items-center font-semibold text-slate-700 dark:text-slate-200">
                        {t.assignedTo.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                      </span>
                      {t.assignedTo}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
              )}
              <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{formatRelative(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

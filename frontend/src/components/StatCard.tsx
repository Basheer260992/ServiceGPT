import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  tone?: 'brand' | 'red' | 'amber' | 'emerald' | 'purple' | 'slate';
  loading?: boolean;
}

const tones: Record<NonNullable<Props['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function StatCard({ label, value, icon: Icon, trend, tone = 'brand', loading }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
        <div className={clsx('w-8 h-8 rounded-md grid place-items-center', tones[tone])}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <div className="skeleton h-7 w-20" />
        ) : (
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
        )}
        {trend && <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</div>}
      </div>
    </div>
  );
}

import clsx from 'clsx';
import type { ReactNode } from 'react';

interface ToneSpec { dot: string; pill: string; }

const PRIORITY_TONE: Record<string, ToneSpec> = {
  Critical: {
    dot: 'bg-red-500',
    pill: 'border-red-200 text-red-700 bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:bg-red-950/30',
  },
  High: {
    dot: 'bg-orange-500',
    pill: 'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900/60 dark:text-orange-300 dark:bg-orange-950/30',
  },
  Moderate: {
    dot: 'bg-amber-500',
    pill: 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:bg-amber-950/30',
  },
  Low: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:bg-emerald-950/30',
  },
};

const STATE_TONE: Record<string, ToneSpec> = {
  New: {
    dot: 'bg-brand-500',
    pill: 'border-brand-200 text-brand-700 bg-brand-50 dark:border-brand-900/60 dark:text-brand-300 dark:bg-brand-950/30',
  },
  'In Progress': {
    dot: 'bg-violet-500',
    pill: 'border-violet-200 text-violet-700 bg-violet-50 dark:border-violet-900/60 dark:text-violet-300 dark:bg-violet-950/30',
  },
  'On Hold': {
    dot: 'bg-amber-500',
    pill: 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:bg-amber-950/30',
  },
  Resolved: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:bg-emerald-950/30',
  },
  Closed: {
    dot: 'bg-slate-400',
    pill: 'border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:bg-slate-900',
  },
  Approved: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:bg-emerald-950/30',
  },
  Assess: {
    dot: 'bg-violet-500',
    pill: 'border-violet-200 text-violet-700 bg-violet-50 dark:border-violet-900/60 dark:text-violet-300 dark:bg-violet-950/30',
  },
  Implement: {
    dot: 'bg-cyan-500',
    pill: 'border-cyan-200 text-cyan-700 bg-cyan-50 dark:border-cyan-900/60 dark:text-cyan-300 dark:bg-cyan-950/30',
  },
  Review: {
    dot: 'bg-indigo-500',
    pill: 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-900/60 dark:text-indigo-300 dark:bg-indigo-950/30',
  },
  'Root Cause Analysis': {
    dot: 'bg-fuchsia-500',
    pill: 'border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 dark:border-fuchsia-900/60 dark:text-fuchsia-300 dark:bg-fuchsia-950/30',
  },
  'Known Error': {
    dot: 'bg-amber-500',
    pill: 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:bg-amber-950/30',
  },
};

const FALLBACK: ToneSpec = {
  dot: 'bg-slate-400',
  pill: 'border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:bg-slate-900',
};

export function PriorityBadge({ value }: { value: string }) {
  const t = PRIORITY_TONE[value] || FALLBACK;
  return (
    <span className={clsx('badge', t.pill)}>
      <span className={clsx('badge-dot', t.dot)} />
      {value}
    </span>
  );
}

export function StateBadge({ value }: { value: string }) {
  const t = STATE_TONE[value] || FALLBACK;
  return (
    <span className={clsx('badge', t.pill)}>
      <span className={clsx('badge-dot', t.dot)} />
      {value}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('badge border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:bg-slate-900', className)}>
      {children}
    </span>
  );
}

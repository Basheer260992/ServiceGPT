import { useEffect, useMemo } from 'react';
import { AlertOctagon, Activity, ShieldAlert, GitPullRequestArrow, CheckCircle2, Gauge } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { TicketTable } from '@/components/TicketTable';
import { useTicketStore } from '@/store/ticket.store';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Moderate: '#f59e0b',
  Low: '#10b981',
};

export default function Dashboard() {
  const { stats, incidents, fetchList, fetchStats, statsLoading } = useTicketStore();
  const { theme } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const isEmployee = user?.role === 'employee';

  useEffect(() => {
    fetchStats();
    fetchList('incidents', { limit: 6 });
  }, [fetchList, fetchStats]);

  useAutoRefresh(() => {
    fetchStats();
    fetchList('incidents', { limit: 6 });
  }, 15000);

  const priorityData = stats?.byPriority || [];
  const stateData = stats?.byState || [];

  const slaPercent = useMemo(() => {
    if (!stats) return 0;
    return Math.min(100, Math.max(0, Math.round(stats.slaAverage)));
  }, [stats]);

  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div>
      <PageHeader
        title={isEmployee ? 'My Dashboard' : 'Operations Dashboard'}
        subtitle={
          isEmployee
            ? 'Status of the tickets you have submitted'
            : 'Real-time view of incidents, problems, and changes across the enterprise'
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label={isEmployee ? 'My Incidents' : 'Total Incidents'} value={stats?.totalIncidents ?? 0} icon={AlertOctagon} tone="brand" loading={statsLoading} />
        <StatCard label={isEmployee ? 'Open' : 'Open Incidents'} value={stats?.openIncidents ?? 0} icon={Activity} tone="amber" loading={statsLoading} />
        <StatCard label={isEmployee ? 'My Problems' : 'Problems'} value={stats?.problems ?? 0} icon={ShieldAlert} tone="red" loading={statsLoading} />
        <StatCard label={isEmployee ? 'My Changes' : 'Change Requests'} value={stats?.changeRequests ?? 0} icon={GitPullRequestArrow} tone="purple" loading={statsLoading} />
        <StatCard label="Resolved" value={stats?.resolvedTickets ?? 0} icon={CheckCircle2} tone="emerald" loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Priority Breakdown</h3>
            <span className="text-xs text-slate-500">Incidents</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={priorityData} dataKey="count" nameKey="priority" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {priorityData.map((d) => (
                    <Cell key={d.priority} fill={PRIORITY_COLORS[d.priority] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}` }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Ticket Status Distribution</h3>
            <span className="text-xs text-slate-500">By state</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={stateData}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="state" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}` }} />
                <Bar dataKey="count" fill="#318cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 grid place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Gauge size={18} /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">SLA Progress</div>
              <div className="text-xl font-bold">{slaPercent}%</div>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${slaPercent}%` }}
            />
          </div>
          <div className="mt-3 text-xs text-slate-500">Average SLA attainment across active incidents.</div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Assigned Tasks</h3>
          <ul className="space-y-2">
            {incidents.data.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 grid place-items-center text-[10px] font-bold">
                  {t.number.slice(-3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.shortDescription}</div>
                  <div className="text-xs text-slate-500">{t.assignedTo || 'Unassigned'} · {t.assignmentGroup}</div>
                </div>
                <span className="text-xs text-slate-500">{t.priority}</span>
              </li>
            ))}
            {incidents.data.length === 0 && <li className="text-sm text-slate-500">No tasks yet.</li>}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold">Recent Tickets</h3>
          <a href="/incidents" className="text-sm text-brand-600 hover:underline">View all →</a>
        </div>
        <TicketTable data={incidents.data} loading={incidents.loading} basePath="/incidents" />
      </div>
    </div>
  );
}

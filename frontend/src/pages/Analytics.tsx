import { useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { useTicketStore } from '@/store/ticket.store';
import { useUIStore } from '@/store/ui.store';

export default function AnalyticsPage() {
  const { stats, incidents, fetchList, fetchStats } = useTicketStore();
  const { theme } = useUIStore();

  useEffect(() => {
    fetchStats();
    fetchList('incidents', { limit: 50 });
  }, [fetchList, fetchStats]);

  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  const trend = useMemo(() => {
    const buckets: Record<string, number> = {};
    incidents.data.forEach((t) => {
      const k = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[k] = (buckets[k] || 0) + 1;
    });
    return Object.entries(buckets).slice(-10).map(([day, count]) => ({ day, count }));
  }, [incidents.data]);

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    incidents.data.forEach((t) => (m[t.category] = (m[t.category] || 0) + 1));
    return Object.entries(m).map(([category, count]) => ({ category, count }));
  }, [incidents.data]);

  return (
    <div>
      <PageHeader title="Analytics Dashboard" subtitle="Insights, trends, and operational KPIs" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Incidents over time</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#318cff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#318cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}` }} />
                <Area type="monotone" dataKey="count" stroke="#1f6ef5" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Incidents by category</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fill: axisColor, fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}` }} />
                <Bar dataKey="count" fill="#1f6ef5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3">Priority distribution</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={stats?.byPriority || []}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="priority" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}` }} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#1f6ef5" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Users as UsersIcon, ShieldCheck, Database, Activity } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { api } from '@/api/client';
import type { User } from '@/types';
import { useTicketStore } from '@/store/ticket.store';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats, fetchStats } = useTicketStore();

  useEffect(() => {
    api.get<User[]>('/users').then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
    fetchStats();
  }, [fetchStats]);

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    support: users.filter((u) => u.role === 'support').length,
    employee: users.filter((u) => u.role === 'employee').length,
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="System health, users, and configuration" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={users.length} icon={UsersIcon} tone="brand" loading={loading} />
        <StatCard label="Active Incidents" value={stats?.openIncidents ?? 0} icon={Activity} tone="amber" />
        <StatCard label="System Health" value="100%" icon={ShieldCheck} tone="emerald" />
        <StatCard label="Storage" value="JSON" icon={Database} tone="purple" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold">Users</h3>
          <div className="flex gap-2 text-xs">
            <span className="badge bg-red-100 text-red-700">{counts.admin} admin</span>
            <span className="badge bg-amber-100 text-amber-700">{counts.support} support</span>
            <span className="badge bg-emerald-100 text-emerald-700">{counts.employee} employee</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-5 py-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 grid place-items-center text-xs font-bold">
                    {u.avatar || u.name[0]}
                  </div>
                  {u.name}
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                <td className="px-5 py-3"><span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">{u.role}</span></td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.department}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td className="px-5 py-6 text-center text-slate-500" colSpan={5}>Admin access required to view users.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

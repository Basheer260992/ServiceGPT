import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/api/client';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data);
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="User Profile" subtitle="Manage your personal information and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white text-3xl font-bold shadow-lg">
            {user.avatar || user.name[0]}
          </div>
          <h2 className="mt-4 text-lg font-semibold">{user.name}</h2>
          <div className="text-sm text-slate-500">{user.email}</div>
          <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 uppercase mt-3">{user.role}</span>
          <div className="text-xs text-slate-400 mt-2">{user.department}</div>
        </div>

        <form onSubmit={submit} className="card p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">Edit Profile</h3>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Avatar initials (2 chars)</label>
            <input className="input" maxLength={2} value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value.toUpperCase() })} />
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

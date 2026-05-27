import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from '@/components/Logo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: 'Engineering', role: 'employee' });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden mb-6"><Logo /></div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Create account</h1>
      <p className="mt-1 text-sm text-slate-500">Start managing your IT operations in minutes.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="support">IT Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          <UserPlus size={16} /> {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </div>
    </div>
  );
}

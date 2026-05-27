import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, ShieldCheck, Wrench, User, ArrowRight, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from '@/components/Logo';

interface DemoAccount {
  email: string;
  password: string;
  role: 'Admin' | 'IT Support' | 'Employee';
  name: string;
  icon: typeof ShieldCheck;
  initials: string;
  tone: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@servicegpt.io',
    password: 'admin123',
    role: 'Admin',
    name: 'System Admin',
    icon: ShieldCheck,
    initials: 'SA',
    tone: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300',
  },
  {
    email: 'sameera@servicegpt.io',
    password: 'support123',
    role: 'IT Support',
    name: 'Sameera Tamboli',
    icon: Wrench,
    initials: 'ST',
    tone: 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300',
  },
  {
    email: 'anita@servicegpt.io',
    password: 'user123',
    role: 'Employee',
    name: 'Anita Juliet Nazareth',
    icon: User,
    initials: 'AN',
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-amber-900/40 dark:text-emerald-300',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, guestLogin, loading } = useAuthStore();
  const [email, setEmail] = useState('admin@servicegpt.io');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [autoSigningIn, setAutoSigningIn] = useState<string | null>(null);

  const doLogin = async (eml: string, pwd: string) => {
    setError('');
    try {
      await login(eml, pwd);
      toast.success('Welcome back');
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const quickSignIn = async (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setAutoSigningIn(acc.email);
    try { await doLogin(acc.email, acc.password); }
    finally { setAutoSigningIn(null); }
  };

  const continueAsGuest = async () => {
    setError('');
    try {
      await guestLogin();
      toast.success('Browsing as guest');
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Guest login failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="lg:hidden mb-8"><Logo /></div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sign in to ServiceGPT</h1>
        <p className="mt-1.5 text-sm text-slate-500">Enter your credentials or use a demo account below.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Work email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Password</label>
            <button type="button" className="text-2xs text-brand-600 hover:text-brand-700 font-medium" onClick={(e) => { e.preventDefault(); toast('Contact your admin for password resets.', { icon: 'ℹ️' }); }}>
              Forgot?
            </button>
          </div>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary w-full !py-2.5" disabled={loading}>
          <LogIn size={15} /> {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-2xs font-medium uppercase tracking-[0.08em] text-slate-400">Demo accounts</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const busy = autoSigningIn === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => quickSignIn(acc)}
                disabled={loading}
                className="group w-full flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left disabled:opacity-60"
              >
                <span className={`w-7 h-7 rounded-md grid place-items-center shrink-0 border ${acc.tone}`}>
                  <Icon size={13} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {acc.name}
                    <span className="ml-1.5 text-2xs font-normal text-slate-500">· {acc.role}</span>
                  </span>
                  <span className="block text-2xs text-slate-500 truncate">{acc.email}</span>
                </span>
                {busy ? (
                  <span className="text-2xs text-brand-600 font-medium">Signing in…</span>
                ) : (
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={continueAsGuest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-medium disabled:opacity-60"
        >
          <Eye size={16} />
          Continue as Guest
        </button>
        <p className="mt-1 text-2xs text-slate-400 text-center">Browse incidents, problems & changes read-only</p>
      </div>

      <div className="mt-8 text-xs text-slate-500 text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">Create one</Link>
      </div>
    </div>
  );
}

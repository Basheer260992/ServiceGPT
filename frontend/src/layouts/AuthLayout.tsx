import { Outlet } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-slate-50 dark:bg-slate-950">
      {/* Hero panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-slate-900">
        {/* Layered background — restrained, no twinkles */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at top left, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top left, black, transparent 70%)',
          }}
        />
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #2557d8 0%, transparent 60%)' }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-white/10 backdrop-blur grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="3" rx="0.5" fill="white" opacity="0.95"/>
                <rect x="3" y="7" width="8" height="3" rx="0.5" fill="white" opacity="0.75"/>
                <rect x="3" y="11" width="6" height="2" rx="0.5" fill="white" opacity="0.55"/>
              </svg>
            </div>
            <span className="text-sm font-medium tracking-tight">ServiceGPT Enterprise</span>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            The IT service portal<br /> your team actually wants to use.
          </h1>
          <p className="mt-4 max-w-md text-white/70 text-sm leading-relaxed">
            Unify incidents, problems, and changes in one workspace. Track SLAs in real time. Resolve tickets faster with an AI assistant trained on your knowledge base.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Real-time operations dashboard',
              'Role-based access for Admin, Support, and Employees',
              'AI assistant grounded in your knowledge base',
              'Direct ServiceNow Table API integration',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm text-white/85">
                <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-white/40 tracking-wider uppercase">
          © {new Date().getFullYear()} ServiceGPT · v1.0
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <Outlet />
      </div>
    </div>
  );
}

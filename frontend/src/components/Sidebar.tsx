import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  ShieldAlert,
  GitPullRequestArrow,
  ShoppingBag,
  BookOpenText,
  BarChart3,
  ShieldCheck,
  UserCircle,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: Role[];
  labelForEmployee?: string;
  section: 'workspace' | 'self-service' | 'admin';
}

const ALL_ROLES: Role[] = ['admin', 'support', 'employee'];

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES, labelForEmployee: 'My Dashboard', section: 'workspace' },
  { to: '/incidents', label: 'Incidents', icon: AlertOctagon, roles: ALL_ROLES, labelForEmployee: 'My Incidents', section: 'workspace' },
  { to: '/problems', label: 'Problems', icon: ShieldAlert, roles: ALL_ROLES, labelForEmployee: 'My Problems', section: 'workspace' },
  { to: '/changes', label: 'Change Requests', icon: GitPullRequestArrow, roles: ALL_ROLES, labelForEmployee: 'My Change Requests', section: 'workspace' },
  { to: '/catalog', label: 'Service Catalog', icon: ShoppingBag, roles: ALL_ROLES, section: 'self-service' },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpenText, roles: ALL_ROLES, section: 'self-service' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'support'], section: 'admin' },
  { to: '/admin', label: 'Administration', icon: ShieldCheck, roles: ['admin'], section: 'admin' },
  { to: '/profile', label: 'Profile', icon: UserCircle, roles: ALL_ROLES, section: 'admin' },
];

const SECTION_TITLES: Record<NavItem['section'], string> = {
  workspace: 'Workspace',
  'self-service': 'Self-service',
  admin: 'Account',
};

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const visible = items.filter((i) => i.roles.includes(user.role));
  const sections: NavItem['section'][] = ['workspace', 'self-service', 'admin'];

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-200',
        sidebarCollapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div className="px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 h-16">
        <Logo collapsed={sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={14} className={clsx('transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section, idx) => {
          const sectionItems = visible.filter((i) => i.section === section);
          if (sectionItems.length === 0) return null;
          return (
            <div key={section} className={clsx(idx > 0 && 'mt-5')}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                  {SECTION_TITLES[section]}
                </div>
              )}
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const label = user.role === 'employee' && item.labelForEmployee ? item.labelForEmployee : item.label;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      title={sidebarCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        clsx(
                          'group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors relative',
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-brand-600 rounded-r" />
                          )}
                          <item.icon size={16} className={clsx('shrink-0', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                          {!sidebarCollapsed && <span className="truncate">{label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 grid place-items-center text-xs font-semibold">
            {user.avatar || user.name[0]}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
}

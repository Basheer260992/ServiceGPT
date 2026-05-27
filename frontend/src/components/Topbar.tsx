import { Bell, Moon, Sun, MessageSquare, LogOut, Search, Menu, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { NotificationService } from '@/services/misc.service';
import type { Notification } from '@/types';
import clsx from 'clsx';

export function Topbar() {
  const { theme, toggleTheme, toggleChat, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [openMenu, setOpenMenu] = useState<'profile' | 'bell' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    NotificationService.list().then(setNotifs).catch(() => {});
    const id = setInterval(() => NotificationService.list().then(setNotifs).catch(() => {}), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await NotificationService.markAllRead();
    NotificationService.list().then(setNotifs);
  };

  const iconBtn = 'inline-grid place-items-center w-8 h-8 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition';

  return (
    <header className="h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center px-3 sm:px-5 gap-2 sticky top-0 z-30">
      <button onClick={toggleSidebar} className={clsx(iconBtn, 'md:hidden')} aria-label="Menu">
        <Menu size={16} />
      </button>

      <div className="hidden sm:flex relative max-w-md w-full">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-12 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-focus transition"
          placeholder="Search tickets, articles, services…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value;
              if (v) navigate(`/incidents?search=${encodeURIComponent(v)}`);
            }
          }}
        />
        <span className="hidden md:inline absolute right-2 top-1/2 -translate-y-1/2 kbd">⌘K</span>
      </div>

      <div className="ml-auto flex items-center gap-1" ref={menuRef}>
        <button onClick={toggleChat} className={iconBtn} aria-label="AI Assistant" title="AI Assistant">
          <MessageSquare size={16} />
        </button>
        <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme" title="Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'bell' ? null : 'bell')}
            className={clsx(iconBtn, 'relative')}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 grid place-items-center bg-brand-600 text-white text-[9px] rounded-full font-semibold leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {openMenu === 'bell' && (
            <div className="absolute right-0 mt-1.5 w-80 card overflow-hidden z-50 shadow-elevated">
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">All caught up</div>
                )}
                {notifs.map((n) => (
                  <div key={n.id} className={clsx('px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 flex gap-2', !n.read && 'bg-brand-50/40 dark:bg-brand-950/10')}>
                    <span className={clsx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', !n.read ? 'bg-brand-500' : 'bg-transparent')} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{n.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <div className="w-7 h-7 rounded-full bg-brand-600 grid place-items-center text-white text-[11px] font-semibold">
              {user?.avatar || user?.name?.[0]}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-medium text-slate-800 dark:text-slate-100">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{user?.role}</div>
            </div>
          </button>
          {openMenu === 'profile' && (
            <div className="absolute right-0 mt-1.5 w-56 card overflow-hidden z-50 shadow-elevated">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
              <button onClick={() => { setOpenMenu(null); navigate('/profile'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Settings size={14} className="text-slate-400" /> Profile settings
              </button>
              <div className="divider" />
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { ChatPanel } from '@/components/ChatPanel';

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-5 sm:p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatPanel />
    </div>
  );
}

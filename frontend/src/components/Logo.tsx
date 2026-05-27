export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md bg-brand-600 grid place-items-center text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3.5C3 3.22386 3.22386 3 3.5 3H12.5C12.7761 3 13 3.22386 13 3.5V5.5C13 5.77614 12.7761 6 12.5 6H3.5C3.22386 6 3 5.77614 3 5.5V3.5Z" fill="currentColor" opacity="0.9"/>
          <path d="M3 7.5C3 7.22386 3.22386 7 3.5 7H10.5C10.7761 7 11 7.22386 11 7.5V9.5C11 9.77614 10.7761 10 10.5 10H3.5C3.22386 10 3 9.77614 3 9.5V7.5Z" fill="currentColor" opacity="0.7"/>
          <path d="M3 11.5C3 11.2239 3.22386 11 3.5 11H8.5C8.77614 11 9 11.2239 9 11.5V12.5C9 12.7761 8.77614 13 8.5 13H3.5C3.22386 13 3 12.7761 3 12.5V11.5Z" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">ServiceGPT</div>
          <div className="text-[10px] tracking-[0.08em] uppercase text-slate-500 dark:text-slate-500">Enterprise</div>
        </div>
      )}
    </div>
  );
}

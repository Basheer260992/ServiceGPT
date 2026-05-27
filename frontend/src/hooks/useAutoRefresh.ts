import { useEffect } from 'react';

export function useAutoRefresh(fn: () => void, interval = 15000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(fn, interval);
    return () => clearInterval(id);
  }, [fn, interval, enabled]);
}

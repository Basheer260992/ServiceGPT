import { create } from 'zustand';
import type { StatsSummary, Ticket, TicketKind } from '@/types';
import { TicketService, type TicketQuery } from '@/services/ticket.service';
import { StatsService } from '@/services/misc.service';

interface TicketBucket {
  data: Ticket[];
  total: number;
  loading: boolean;
}

interface TicketState {
  incidents: TicketBucket;
  problems: TicketBucket;
  changes: TicketBucket;
  stats: StatsSummary | null;
  statsLoading: boolean;
  fetchList: (kind: TicketKind, query?: TicketQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  createTicket: (kind: TicketKind, body: Partial<Ticket>) => Promise<Ticket>;
}

const emptyBucket = (): TicketBucket => ({ data: [], total: 0, loading: false });

export const useTicketStore = create<TicketState>((set, get) => ({
  incidents: emptyBucket(),
  problems: emptyBucket(),
  changes: emptyBucket(),
  stats: null,
  statsLoading: false,

  fetchList: async (kind, query) => {
    set({ [kind]: { ...get()[kind], loading: true } } as any);
    try {
      const res = await TicketService.list(kind, query);
      set({ [kind]: { data: res.data, total: res.total, loading: false } } as any);
    } catch {
      set({ [kind]: { ...get()[kind], loading: false } } as any);
    }
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await StatsService.summary();
      set({ stats, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  createTicket: async (kind, body) => {
    const created = await TicketService.create(kind, body);
    const bucket = get()[kind];
    set({ [kind]: { ...bucket, data: [created, ...bucket.data], total: bucket.total + 1 } } as any);
    // refresh stats so dashboard counters move
    get().fetchStats();
    return created;
  },
}));

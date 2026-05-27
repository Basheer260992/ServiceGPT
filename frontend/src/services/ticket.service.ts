import { api } from '@/api/client';
import type { Paginated, Ticket, TicketKind } from '@/types';

export interface TicketQuery {
  state?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const TicketService = {
  list: (kind: TicketKind, query: TicketQuery = {}) =>
    api.get<Paginated<Ticket>>(`/${kind}`, { params: query }).then((r) => r.data),
  get: (kind: TicketKind, id: string) =>
    api.get<Ticket>(`/${kind}/${id}`).then((r) => r.data),
  create: (kind: TicketKind, body: Partial<Ticket>) =>
    api.post<Ticket>(`/${kind}`, body).then((r) => r.data),
  update: (kind: TicketKind, id: string, body: Partial<Ticket>) =>
    api.put<Ticket>(`/${kind}/${id}`, body).then((r) => r.data),
  remove: (kind: TicketKind, id: string) =>
    api.delete(`/${kind}/${id}`).then((r) => r.data),
};

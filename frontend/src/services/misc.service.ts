import { api } from '@/api/client';
import type { CatalogItem, ChatMessage, KnowledgeArticle, Notification, StatsSummary } from '@/types';

export const StatsService = {
  summary: () => api.get<StatsSummary>('/stats/summary').then((r) => r.data),
};

export const CatalogService = {
  list: () => api.get<CatalogItem[]>('/catalog').then((r) => r.data),
};

export const KnowledgeService = {
  list: (search?: string) =>
    api.get<KnowledgeArticle[]>('/knowledge', { params: search ? { search } : {} }).then((r) => r.data),
  get: (id: string) => api.get<KnowledgeArticle>(`/knowledge/${id}`).then((r) => r.data),
};

export const NotificationService = {
  list: () => api.get<Notification[]>('/notifications').then((r) => r.data),
  markRead: (id: string) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};

export const ChatService = {
  history: () => api.get<ChatMessage[]>('/chat').then((r) => r.data),
  send: (text: string) =>
    api.post<{ user: ChatMessage; bot: ChatMessage }>('/chat', { text }).then((r) => r.data),
};

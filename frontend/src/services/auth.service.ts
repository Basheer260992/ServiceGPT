import { api } from '@/api/client';
import type { User } from '@/types';

export interface AuthResponse { token: string; user: User; }

export const AuthService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (data: { name: string; email: string; password: string; role?: string; department?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  guest: () => api.get<AuthResponse>('/auth/guest').then((r) => r.data),
};

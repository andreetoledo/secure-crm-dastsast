'use client';

import type { AuthResponse, DashboardStats, Ticket, User } from '@secure-crm/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';

// NOTA (didáctica): el token JWT se guarda en localStorage, accesible por
// cualquier script -> agrava el impacto de un XSS (robo de sesión).
export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}
export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  dashboard: () => request<DashboardStats>('/api/dashboard'),
  tickets: (q?: string) =>
    (() => {
      const qs = q ? `?q=${encodeURIComponent(q)}` : '';
      return request<{ query: string; tickets: Ticket[] }>(`/api/tickets${qs}`);
    })(),
  ticket: (id: number | string) => request<Ticket>(`/api/tickets/${id}`),
  createTicket: (body: Partial<Ticket>) =>
    request<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(body) }),
  updateTicket: (id: number | string, body: Partial<Ticket>) =>
    request<Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTicket: (id: number | string) =>
    request<{ ok: boolean }>(`/api/tickets/${id}`, { method: 'DELETE' }),
  users: () => request<User[]>('/api/users'),
  createUser: (body: any) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  setRole: (id: number | string, role: string) =>
    request<any>(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};

export { API_URL };

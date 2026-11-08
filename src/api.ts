import type { Activity, ChartEntry, ChartId, Note, NoteCategory, UsefulLink } from './types';

let dashboardPassword = '';

export function clearDashboardPassword() {
  dashboardPassword = '';
}

function headers(options?: RequestInit, password = dashboardPassword) {
  const result = new Headers(options?.headers);
  result.set('Content-Type', 'application/json');
  if (password) result.set('Authorization', `Bearer ${password}`);
  return result;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: headers(options),
  });
  if (!response.ok) throw new Error(await response.text() || 'Request failed');
  return response.json() as Promise<T>;
}

export const api = {
  async authenticate(password: string) {
    const response = await fetch('/api/auth', { headers: headers(undefined, password), cache: 'no-store' });
    if (!response.ok) throw new Error(await response.text() || 'Incorrect password');
    dashboardPassword = password;
  },
  getChart: (id: ChartId) => request<ChartEntry[]>(`/api/charts/${id}`),
  saveChartEntry: (id: ChartId, entry: ChartEntry) => request<ChartEntry[]>(`/api/charts/${id}`, {
    method: 'POST', body: JSON.stringify(entry),
  }),
  getNotes: () => request<Note[]>('/api/notes'),
  addNote: (note: Omit<Note, 'id'>) => request<Note[]>('/api/notes', {
    method: 'POST', body: JSON.stringify(note),
  }),
  deleteNote: (id: string) => request<Note[]>(`/api/notes/${id}`, { method: 'DELETE' }),
  getUsefulLinks: () => request<UsefulLink[]>('/api/links'),
  addUsefulLink: (link: Omit<UsefulLink, 'id'>) => request<UsefulLink[]>('/api/links', {
    method: 'POST', body: JSON.stringify(link),
  }),
  deleteUsefulLink: (id: string) => request<UsefulLink[]>(`/api/links/${id}`, { method: 'DELETE' }),
  getActivities: () => request<Activity[]>('/api/activities'),
  addActivity: (text: string) => request<Activity[]>('/api/activities', {
    method: 'POST', body: JSON.stringify({ text }),
  }),
  updateActivity: (id: string, done: boolean) => request<Activity[]>(`/api/activities/${id}`, {
    method: 'PATCH', body: JSON.stringify({ done }),
  }),
  deleteActivity: (id: string) => request<Activity[]>(`/api/activities/${id}`, { method: 'DELETE' }),
};

export function isNoteCategory(value: string): value is NoteCategory {
  return value === 'App ideas' || value === 'Story ideas';
}

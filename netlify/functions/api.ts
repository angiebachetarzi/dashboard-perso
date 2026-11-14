import { createHash, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Activity, ChartEntry, ChartId, Note, Todo, TodoPriority, UsefulLink } from '../../src/types';
import { chartIds, sampleActivities, sampleCharts, sampleLinks, sampleNotes } from '../../src/initialData';

const storeName = 'personal-dashboard';
const storeRegion = 'eu-central-1';
const noStoreHeaders = { 'Cache-Control': 'no-store' };

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: noStoreHeaders });
}

function error(message: string, status: number): Response {
  return new Response(message, { status, headers: { ...noStoreHeaders, 'Content-Type': 'text/plain' } });
}

function passwordMatches(request: Request): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || Buffer.byteLength(expected) < 32) return false;
  const authorization = request.headers.get('authorization') ?? '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedHash = createHash('sha256').update(expected).digest();
  const suppliedHash = createHash('sha256').update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

function isPasswordConfigured(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD && Buffer.byteLength(process.env.DASHBOARD_PASSWORD) >= 32);
}

function getDashboardStore() {
  return getStore({ name: storeName, region: storeRegion, consistency: 'strong' });
}

async function readCollection<T>(key: string, initialValue: T): Promise<T> {
  const store = getDashboardStore();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const saved = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' }) as { data: T } | null;
    if (saved) return saved.data;
    const result = await store.setJSON(key, initialValue, { onlyIfNew: true });
    if (result.modified) return initialValue;
  }
  throw new Error(`Could not initialize ${key}`);
}

async function updateCollection<T>(key: string, initialValue: T, update: (value: T) => T): Promise<T> {
  const store = getDashboardStore();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const saved = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' }) as { data: T; etag?: string } | null;
    const updated = update(saved?.data ?? initialValue);
    const result = saved?.etag
      ? await store.setJSON(key, updated, { onlyIfMatch: saved.etag })
      : saved
        ? { modified: false }
        : await store.setJSON(key, updated, { onlyIfNew: true });
    if (result.modified) return updated;
    await new Promise((resolve) => setTimeout(resolve, Math.min(100, 10 * (attempt + 1))));
  }
  throw new Error(`Could not update ${key} after repeated concurrent writes`);
}

function isChartId(value: string): value is ChartId {
  return chartIds.includes(value as ChartId);
}

function parseApiPath(url: URL): string {
  const functionPrefix = '/.netlify/functions/api';
  let path = url.pathname.startsWith(functionPrefix) ? url.pathname.slice(functionPrefix.length) : url.pathname;
  if (path === '/api') return '/';
  if (path.startsWith('/api/')) path = path.slice('/api'.length);
  return path || '/';
}

async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

function validUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = parseApiPath(url);

  if (path === '/auth' && request.method === 'GET') {
    if (!isPasswordConfigured()) return error('Set a DASHBOARD_PASSWORD of at least 32 characters in Netlify environment settings.', 503);
    return passwordMatches(request) ? json({ ok: true }) : error('Incorrect password', 401);
  }

  if (!isPasswordConfigured()) return error('Dashboard password is not configured.', 503);
  if (!passwordMatches(request)) return error('Unauthorized', 401);

  try {
    const chartRoute = path.match(/^\/charts\/([^/]+)$/);
    if (chartRoute) {
      const chartId = decodeURIComponent(chartRoute[1]);
      if (!isChartId(chartId)) return error('Unknown chart', 404);
      const key = `charts/${chartId}`;
      if (request.method === 'GET') return json(await readCollection(key, sampleCharts[chartId]));
      if (request.method === 'POST') {
        const entry = await parseBody<ChartEntry>(request);
        if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
          || !(entry.value1 === null || (typeof entry.value1 === 'number' && Number.isFinite(entry.value1)))
          || !(entry.value2 === null || (typeof entry.value2 === 'number' && Number.isFinite(entry.value2)))
          || (entry.value1 === null && entry.value2 === null)
          || (chartId === 'personal-weight' && entry.value1 === null)) return error('Invalid chart entry', 400);
        const updated = await updateCollection<ChartEntry[]>(key, sampleCharts[chartId], (rows) => {
          const existing = rows.find((row) => row.date === entry.date);
          const merged = {
            ...entry,
            value1: entry.value1 ?? existing?.value1 ?? null,
            value2: entry.value2 ?? existing?.value2 ?? null,
          };
          return [...rows.filter((row) => row.date !== entry.date), merged].sort((a, b) => a.date.localeCompare(b.date));
        });
        return json(updated);
      }
    }

    const chartValueRoute = path.match(/^\/charts\/([^/]+)\/(\d{4}-\d{2}-\d{2})\/(value1|value2)$/);
    if (chartValueRoute && request.method === 'DELETE') {
      const chartId = decodeURIComponent(chartValueRoute[1]);
      const date = chartValueRoute[2];
      const valueKey = chartValueRoute[3] as 'value1' | 'value2';
      if (!isChartId(chartId)) return error('Unknown chart', 404);
      if (chartId === 'personal-weight' && valueKey === 'value2') return error('Unknown series', 404);
      const key = `charts/${chartId}`;
      const updated = await updateCollection<ChartEntry[]>(key, sampleCharts[chartId], (rows) => {
        const current = rows.find((row) => row.date === date);
        if (!current || current[valueKey] === null) return rows;
        const changed = { ...current, [valueKey]: null };
        return changed.value1 === null && changed.value2 === null
          ? rows.filter((row) => row.date !== date)
          : rows.map((row) => row.date === date ? changed : row);
      });
      return json(updated);
    }

    if (path === '/notes') {
      if (request.method === 'GET') return json(await readCollection<Note[]>('notes', sampleNotes));
      if (request.method === 'POST') {
        const body = await parseBody<{ category?: string; text?: string }>(request);
        if (!body || (body.category !== 'App ideas' && body.category !== 'Story ideas') || !body.text?.trim()) {
          return error('Invalid note', 400);
        }
        const updated = await updateCollection<Note[]>('notes', sampleNotes, (notes) => [
          { id: crypto.randomUUID(), category: body.category as Note['category'], text: body.text!.trim() },
          ...notes,
        ]);
        return json(updated);
      }
    }

    const noteRoute = path.match(/^\/notes\/([^/]+)$/);
    if (noteRoute && request.method === 'DELETE') {
      const updated = await updateCollection<Note[]>('notes', sampleNotes, (notes) => notes.filter((note) => note.id !== decodeURIComponent(noteRoute[1])));
      return json(updated);
    }

    if (path === '/links') {
      if (request.method === 'GET') return json(await readCollection<UsefulLink[]>('links', sampleLinks));
      if (request.method === 'POST') {
        const body = await parseBody<{ title?: string; url?: string }>(request);
        if (!body?.title?.trim() || !validUrl(body.url)) return error('Enter a name and a valid http or https URL', 400);
        const updated = await updateCollection<UsefulLink[]>('links', sampleLinks, (links) => [
          { id: crypto.randomUUID(), title: body.title!.trim(), url: body.url! },
          ...links,
        ]);
        return json(updated);
      }
    }

    const linkRoute = path.match(/^\/links\/([^/]+)$/);
    if (linkRoute && request.method === 'DELETE') {
      const updated = await updateCollection<UsefulLink[]>('links', sampleLinks, (links) => links.filter((link) => link.id !== decodeURIComponent(linkRoute[1])));
      return json(updated);
    }

    if (path === '/activities') {
      if (request.method === 'GET') return json(await readCollection<Activity[]>('activities', sampleActivities));
      if (request.method === 'POST') {
        const body = await parseBody<{ text?: string }>(request);
        if (!body?.text?.trim()) return error('Enter an activity', 400);
        const updated = await updateCollection<Activity[]>('activities', sampleActivities, (activities) => [
          { id: crypto.randomUUID(), text: body.text!.trim(), done: false },
          ...activities,
        ]);
        return json(updated);
      }
    }

    const activityRoute = path.match(/^\/activities\/([^/]+)$/);
    if (activityRoute) {
      const id = decodeURIComponent(activityRoute[1]);
      if (request.method === 'PATCH') {
        const body = await parseBody<{ done?: boolean }>(request);
        if (typeof body?.done !== 'boolean') return error('Invalid activity state', 400);
        const updated = await updateCollection<Activity[]>('activities', sampleActivities, (activities) => activities.map((activity) => activity.id === id ? { ...activity, done: body.done! } : activity));
        return json(updated);
      }
      if (request.method === 'DELETE') {
        const updated = await updateCollection<Activity[]>('activities', sampleActivities, (activities) => activities.filter((activity) => activity.id !== id));
        return json(updated);
      }
    }

    if (path === '/todos') {
      if (request.method === 'GET') return json(await readCollection<Todo[]>('todos', []));
      if (request.method === 'POST') {
        const body = await parseBody<{ text?: string; priority?: TodoPriority }>(request);
        if (!body?.text?.trim() || !['high', 'medium', 'low'].includes(body.priority ?? '')) {
          return error('Enter a todo and choose a valid priority', 400);
        }
        const updated = await updateCollection<Todo[]>('todos', [], (todos) => [{
          id: crypto.randomUUID(),
          text: body.text!.trim(),
          done: false,
          priority: body.priority!,
        }, ...todos]);
        return json(updated);
      }
    }

    const todoRoute = path.match(/^\/todos\/([^/]+)$/);
    if (todoRoute) {
      const id = decodeURIComponent(todoRoute[1]);
      if (request.method === 'PATCH') {
        const body = await parseBody<{ done?: boolean }>(request);
        if (typeof body?.done !== 'boolean') return error('Invalid todo state', 400);
        const updated = await updateCollection<Todo[]>('todos', [], (todos) => todos.map((todo) => todo.id === id ? { ...todo, done: body.done! } : todo));
        return json(updated);
      }
      if (request.method === 'DELETE') {
        const updated = await updateCollection<Todo[]>('todos', [], (todos) => todos.filter((todo) => todo.id !== id));
        return json(updated);
      }
    }

    return error('Not found', 404);
  } catch {
    return error('Could not read or save dashboard data', 500);
  }
}

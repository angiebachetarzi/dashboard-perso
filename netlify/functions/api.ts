import { createHash, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Activity, ChartEntry, ChartId, Note, UsefulLink } from '../../src/types';
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
  return getStore({ name: storeName, region: storeRegion });
}

async function readCollection<T>(key: string, initialValue: T): Promise<T> {
  const store = getDashboardStore();
  const saved = await store.get(key, { type: 'json' }) as T | null;
  if (saved !== null) return saved;
  await store.setJSON(key, initialValue);
  return initialValue;
}

async function writeCollection<T>(key: string, value: T): Promise<void> {
  await getDashboardStore().setJSON(key, value);
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
          || !Number.isFinite(entry.value1)
          || !(entry.value2 === null || Number.isFinite(entry.value2))) return error('Invalid chart entry', 400);
        const rows = await readCollection<ChartEntry[]>(key, sampleCharts[chartId]);
        const updated = [...rows.filter((row) => row.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
        await writeCollection(key, updated);
        return json(updated);
      }
    }

    if (path === '/notes') {
      if (request.method === 'GET') return json(await readCollection<Note[]>('notes', sampleNotes));
      if (request.method === 'POST') {
        const body = await parseBody<{ category?: string; text?: string }>(request);
        if (!body || (body.category !== 'App ideas' && body.category !== 'Story ideas') || !body.text?.trim()) {
          return error('Invalid note', 400);
        }
        const notes = await readCollection<Note[]>('notes', sampleNotes);
        const updated = [{ id: crypto.randomUUID(), category: body.category, text: body.text.trim() }, ...notes];
        await writeCollection('notes', updated);
        return json(updated);
      }
    }

    const noteRoute = path.match(/^\/notes\/([^/]+)$/);
    if (noteRoute && request.method === 'DELETE') {
      const notes = await readCollection<Note[]>('notes', sampleNotes);
      const updated = notes.filter((note) => note.id !== decodeURIComponent(noteRoute[1]));
      await writeCollection('notes', updated);
      return json(updated);
    }

    if (path === '/links') {
      if (request.method === 'GET') return json(await readCollection<UsefulLink[]>('links', sampleLinks));
      if (request.method === 'POST') {
        const body = await parseBody<{ title?: string; url?: string }>(request);
        if (!body?.title?.trim() || !validUrl(body.url)) return error('Enter a name and a valid http or https URL', 400);
        const links = await readCollection<UsefulLink[]>('links', sampleLinks);
        const updated = [{ id: crypto.randomUUID(), title: body.title.trim(), url: body.url }, ...links];
        await writeCollection('links', updated);
        return json(updated);
      }
    }

    const linkRoute = path.match(/^\/links\/([^/]+)$/);
    if (linkRoute && request.method === 'DELETE') {
      const links = await readCollection<UsefulLink[]>('links', sampleLinks);
      const updated = links.filter((link) => link.id !== decodeURIComponent(linkRoute[1]));
      await writeCollection('links', updated);
      return json(updated);
    }

    if (path === '/activities') {
      if (request.method === 'GET') return json(await readCollection<Activity[]>('activities', sampleActivities));
      if (request.method === 'POST') {
        const body = await parseBody<{ text?: string }>(request);
        if (!body?.text?.trim()) return error('Enter an activity', 400);
        const activities = await readCollection<Activity[]>('activities', sampleActivities);
        const updated = [{ id: crypto.randomUUID(), text: body.text.trim(), done: false }, ...activities];
        await writeCollection('activities', updated);
        return json(updated);
      }
    }

    const activityRoute = path.match(/^\/activities\/([^/]+)$/);
    if (activityRoute) {
      const id = decodeURIComponent(activityRoute[1]);
      const activities = await readCollection<Activity[]>('activities', sampleActivities);
      if (request.method === 'PATCH') {
        const body = await parseBody<{ done?: boolean }>(request);
        if (typeof body?.done !== 'boolean') return error('Invalid activity state', 400);
        const updated = activities.map((activity) => activity.id === id ? { ...activity, done: body.done! } : activity);
        await writeCollection('activities', updated);
        return json(updated);
      }
      if (request.method === 'DELETE') {
        const updated = activities.filter((activity) => activity.id !== id);
        await writeCollection('activities', updated);
        return json(updated);
      }
    }

    return error('Not found', 404);
  } catch {
    return error('Could not read or save dashboard data', 500);
  }
}

import type { Activity, ChartEntry, ChartId, Note, UsefulLink } from './types';

export const chartIds: ChartId[] = ['personal-weight', 'cats-weight', 'cats-bpm'];

export const sampleCharts: Record<ChartId, ChartEntry[]> = {
  'personal-weight': [
    { date: '2026-10-01', value1: 72.8, value2: null }, { date: '2026-10-08', value1: 72.4, value2: null },
    { date: '2026-10-15', value1: 72.9, value2: null }, { date: '2026-10-22', value1: 72.1, value2: null },
    { date: '2026-10-29', value1: 71.9, value2: null }, { date: '2026-11-05', value1: 71.6, value2: null },
  ],
  'cats-weight': [
    { date: '2026-10-01', value1: 4.5, value2: 5.1 }, { date: '2026-10-08', value1: 4.6, value2: 5.0 },
    { date: '2026-10-15', value1: 4.5, value2: 5.2 }, { date: '2026-10-22', value1: 4.7, value2: 5.1 },
    { date: '2026-10-29', value1: 4.6, value2: 5.0 }, { date: '2026-11-05', value1: 4.7, value2: 5.1 },
  ],
  'cats-bpm': [
    { date: '2026-10-01', value1: 158, value2: 162 }, { date: '2026-10-08', value1: 155, value2: 160 },
    { date: '2026-10-15', value1: 160, value2: 164 }, { date: '2026-10-22', value1: 157, value2: 161 },
    { date: '2026-10-29', value1: 154, value2: 159 }, { date: '2026-11-05', value1: 156, value2: 160 },
  ],
};

export const sampleNotes: Note[] = [
  { id: 'sample-story', category: 'Story ideas', text: 'A lighthouse keeper receives letters dated tomorrow.' },
  { id: 'sample-app', category: 'App ideas', text: 'A tiny app to track household projects.' },
];

export const sampleLinks: UsefulLink[] = [
  { id: 'reddit', title: 'Reddit', url: 'https://www.reddit.com/' },
];

export const sampleActivities: Activity[] = [];

export type ChartId = 'personal-weight' | 'cats-weight' | 'cats-bpm';
export type ValueKey = 'value1' | 'value2';
export type NoteCategory = 'App ideas' | 'Story ideas';

export interface ChartEntry {
  date: string;
  value1: number;
  value2: number | null;
}

export interface Note {
  id: string;
  category: NoteCategory;
  text: string;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
}

export interface Activity {
  id: string;
  text: string;
  done: boolean;
}


export interface ChartSeries {
  key: ValueKey;
  name: string;
  color: 'blue' | 'orange';
}

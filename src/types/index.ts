export interface TheftRecord {
  id: string;
  type: 'auto' | 'bike';
  date: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  neighbourhood: string;
  premiseType: string;
  lat: number;
  lng: number;
  status: string;
}

export type ViewMode = 'scatter' | 'heatmap';
export type TheftFilter = 'all' | 'auto' | 'bike';

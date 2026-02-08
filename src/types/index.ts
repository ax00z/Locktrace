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

export interface HeatmapCell {
  lat: number;
  lng: number;
  count: number;
  intensity: number;
}

export interface NeighbourhoodStat {
  name: string;
  autoThefts: number;
  bikeThefts: number;
  total: number;
}

export interface TimeSeriesPoint {
  label: string;
  auto: number;
  bike: number;
}

export type ViewMode = 'scatter' | 'heatmap';
export type TheftFilter = 'all' | 'auto' | 'bike';

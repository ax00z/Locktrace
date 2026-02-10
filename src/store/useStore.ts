import { create } from 'zustand';
import type { TheftRecord, ViewMode, TheftFilter } from '../types';

type Theme = 'dark' | 'light';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface AppState {
  records: TheftRecord[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  filter: TheftFilter;
  selectedRecord: TheftRecord | null;
  dataSource: 'static' | 'live' | null;
  lastUpdated: string | null;
  theme: Theme;

  setRecords: (records: TheftRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (filter: TheftFilter) => void;
  setSelectedRecord: (record: TheftRecord | null) => void;
  setDataSource: (source: 'static' | 'live') => void;
  setLastUpdated: (date: string) => void;
  toggleTheme: () => void;
  filteredRecords: () => TheftRecord[];
}

export const useStore = create<AppState>((set, get) => ({
  records: [],
  loading: true,
  error: null,
  viewMode: 'heatmap',
  filter: 'all',
  selectedRecord: null,
  dataSource: null,
  lastUpdated: null,
  theme: getSystemTheme(),

  setRecords: (records) => set({ records }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilter: (filter) => set({ filter }),
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  setDataSource: (dataSource) => set({ dataSource }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  filteredRecords: () => {
    const { records, filter } = get();
    if (filter === 'all') return records;
    return records.filter((r) => r.type === filter);
  },
}));

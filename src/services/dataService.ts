import type { TheftRecord } from '../types';

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/ax00z/locktrace/main/public/data/locktrace_live.json';

const LOCAL_FALLBACK = '/data/locktrace_live.json';

async function loadFromUrl(url: string): Promise<TheftRecord[]> {
  const resp = await fetch(`${url}?_t=${Date.now()}`, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${url}`);
  const data: TheftRecord[] = await resp.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Empty dataset');
  return data;
}

export async function fetchAllData(): Promise<{ records: TheftRecord[]; source: 'live' | 'static' }> {
  try {
    const records = await loadFromUrl(GITHUB_RAW_URL);
    return { records, source: 'live' };
  } catch {
    try {
      const records = await loadFromUrl(LOCAL_FALLBACK);
      return { records, source: 'static' };
    } catch {
      throw new Error('All data sources failed');
    }
  }
}

export async function fetchLiveDataOnly(): Promise<{ records: TheftRecord[]; source: 'live' }> {
  const records = await loadFromUrl(GITHUB_RAW_URL);
  return { records, source: 'live' };
}

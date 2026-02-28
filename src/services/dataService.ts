import type { TheftRecord } from '../types';

const AUTO_THEFT_API =
  'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Auto_Theft_Open_Data/FeatureServer/0/query';
const BIKE_THEFT_API =
  'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Bicycle_Thefts_Open_Data/FeatureServer/0/query';

const PAGE_SIZE = 2000;

function threeMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MONTH_NAMES: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

function toMonthNum(m: string | number): number {
  if (typeof m === 'number') return m;
  return MONTH_NAMES[m] || 1;
}

function parseEpoch(val: unknown): Date | null {
  if (typeof val === 'number' && val > 1_000_000_000) {
    return new Date(val > 1e12 ? val : val * 1000);
  }
  if (typeof val === 'string' && val.length >= 10) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRecord(f: any, theftType: 'auto' | 'bike'): TheftRecord | null {
  const a = f.attributes || f;
  const rawLat = f.geometry?.y ?? a.LAT_WGS84 ?? a.Y ?? 0;
  const rawLng = f.geometry?.x ?? a.LONG_WGS84 ?? a.X ?? 0;

  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  if (lat < 41 || lat > 57 || lng < -95 || lng > -73) return null;

  const rawDate = a.OCC_DATE ?? a.REPORT_DATE ?? '';
  const parsed = parseEpoch(rawDate);
  const now = new Date();
  const year = parsed ? parsed.getFullYear() : Number(a.OCC_YEAR) || now.getFullYear();
  const month = parsed ? parsed.getMonth() + 1 : (a.OCC_MONTH != null ? toMonthNum(a.OCC_MONTH) : 1);
  const day = parsed ? parsed.getDate() : (Number(a.OCC_DAY) || 1);
  const hour = Number(a.OCC_HOUR ?? 12) || 0;
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const recordDate = new Date(year, month - 1, day);
  if (recordDate < threeMonthsAgo() || recordDate > now) return null;

  return {
    id: `${theftType}-${a.EVENT_UNIQUE_ID || a.OBJECTID || ''}`,
    type: theftType,
    date: dateStr,
    year, month, day, hour,
    neighbourhood: String(a.NEIGHBOURHOOD_158 || a.NEIGHBOURHOOD_140 || a.HOOD_158 || a.NEIGHBOURHOOD || 'Unknown').trim(),
    premiseType: String(a.PREMISES_TYPE || a.PREMISE_TYPE || 'Unknown').trim(),
    lat, lng,
    status: String(a.STATUS || 'Unknown').trim(),
  };
}

async function fetchPaginated(url: string, where: string): Promise<unknown[]> {
  const all: unknown[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where, 
      outFields: '*', 
      outSR: '4326', 
      f: 'json',
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      _t: Date.now().toString() // Cache Buster
    });

    // Force network fetch, bypass browser cache
    const resp = await fetch(`${url}?${params}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`API returned ${resp.status}`);
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message || 'ArcGIS error');

    const features = json.features || [];
    if (features.length === 0) break;

    all.push(...features);
    offset += PAGE_SIZE;

    if (!json.exceededTransferLimit && features.length < PAGE_SIZE) break;
    if (offset >= PAGE_SIZE * 50) break;
  }

  return all;
}

async function fetchWithFallback(url: string): Promise<unknown[]> {
  const year = new Date().getFullYear();
  const strategies = [
    `OCC_YEAR >= ${year - 1}`,
    `OCC_YEAR >= ${year}`,
    '1=1',
  ];

  for (const where of strategies) {
    try {
      const features = await fetchPaginated(url, where);
      if (features.length > 0) return features;
    } catch {
      continue;
    }
  }

  throw new Error('All query strategies failed');
}

async function fetchLive(url: string, type: 'auto' | 'bike'): Promise<TheftRecord[]> {
  const features = await fetchWithFallback(url);
  return features
    .map((f) => parseRecord(f, type))
    .filter((r): r is TheftRecord => r !== null);
}

async function fetchStatic(path: string): Promise<TheftRecord[]> {
  const resp = await fetch(`${path}?_t=${Date.now()}`, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`Not found: ${path}`);
  const data: TheftRecord[] = await resp.json();
  const cutoff = threeMonthsAgo();
  const now = new Date();
  return data.filter((r) => {
    const d = new Date(r.year, r.month - 1, r.day);
    return d >= cutoff && d <= now;
  });
}

function deduplicate(records: TheftRecord[]): TheftRecord[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = `${r.type}-${r.date}-${r.lat.toFixed(5)}-${r.lng.toFixed(5)}-${r.hour}-${r.neighbourhood}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assignUniqueIds(records: TheftRecord[]): TheftRecord[] {
  const counts = new Map<string, number>();
  return records.map((r) => {
    const n = counts.get(r.id) || 0;
    counts.set(r.id, n + 1);
    return n > 0 ? { ...r, id: `${r.id}-${n}` } : r;
  });
}

function prepare(records: TheftRecord[]): TheftRecord[] {
  let result = deduplicate(records);
  result = assignUniqueIds(result);
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return result;
}

export async function fetchAllData(): Promise<{ records: TheftRecord[]; source: 'static' | 'live' }> {
  try {
    const [auto, bike] = await Promise.all([
      fetchStatic('/data/auto_thefts.json'),
      fetchStatic('/data/bike_thefts.json'),
    ]);
    if (auto.length === 0 && bike.length === 0) throw new Error('Static files empty');
    return { records: prepare([...auto, ...bike]), source: 'static' };
  } catch {
    return fetchLiveDataOnly();
  }
}

export async function fetchLiveDataOnly(): Promise<{ records: TheftRecord[]; source: 'live' }> {
  const [auto, bike] = await Promise.all([
    fetchLive(AUTO_THEFT_API, 'auto'),
    fetchLive(BIKE_THEFT_API, 'bike'),
  ]);
  return { records: prepare([...auto, ...bike]), source: 'live' };
}
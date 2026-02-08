import type { TheftRecord } from '../types';

const AUTO_THEFT_API =
  'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query';
const BIKE_THEFT_API =
  'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/Bicycle_Thefts_Open_Data/FeatureServer/0/query';

function sixMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentYear(): number {
  return new Date().getFullYear();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAutoRecord(f: any): TheftRecord | null {
  const a = f.attributes || f;
  const lat = f.geometry?.y ?? a.LAT_WGS84 ?? a.Y ?? 0;
  const lng = f.geometry?.x ?? a.LONG_WGS84 ?? a.X ?? 0;
  if (lat === 0 && lng === 0) return null;
  if (a.MCI_CATEGORY && !a.MCI_CATEGORY.toLowerCase().includes('auto theft')) return null;

  return {
    id: `auto-${a.EVENT_UNIQUE_ID || a.OBJECTID || Math.random()}`,
    type: 'auto',
    date: a.OCC_DATE || a.REPORT_DATE || '',
    year: a.OCC_YEAR || currentYear(),
    month: a.OCC_MONTH ? monthNameToNum(a.OCC_MONTH) : (a.OCC_MONTH_NUM || 1),
    day: a.OCC_DAY || 1,
    hour: a.OCC_HOUR ?? 12,
    neighbourhood: a.NEIGHBOURHOOD_158 || a.NEIGHBOURHOOD_140 || a.HOOD_158 || a.NEIGHBOURHOOD || 'Unknown',
    premiseType: a.PREMISES_TYPE || a.PREMISE_TYPE || 'Unknown',
    lat,
    lng,
    status: a.STATUS || 'Unknown',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBikeRecord(f: any): TheftRecord | null {
  const a = f.attributes || f;
  const lat = f.geometry?.y ?? a.LAT_WGS84 ?? a.Y ?? 0;
  const lng = f.geometry?.x ?? a.LONG_WGS84 ?? a.X ?? 0;
  if (lat === 0 && lng === 0) return null;

  return {
    id: `bike-${a.EVENT_UNIQUE_ID || a.OBJECTID || Math.random()}`,
    type: 'bike',
    date: a.OCC_DATE || a.REPORT_DATE || '',
    year: a.OCC_YEAR || currentYear(),
    month: a.OCC_MONTH ? monthNameToNum(a.OCC_MONTH) : (a.OCC_MONTH_NUM || 1),
    day: a.OCC_DAY || 1,
    hour: a.OCC_HOUR ?? 12,
    neighbourhood: a.NEIGHBOURHOOD_158 || a.NEIGHBOURHOOD_140 || a.HOOD_158 || a.NEIGHBOURHOOD || 'Unknown',
    premiseType: a.PREMISES_TYPE || a.PREMISE_TYPE || 'Unknown',
    lat,
    lng,
    status: a.STATUS || 'Unknown',
  };
}

function monthNameToNum(m: string): number {
  const months: Record<string, number> = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };
  return months[m] || 1;
}

async function fetchFromAPI(url: string, where: string): Promise<unknown[]> {
  const params = new URLSearchParams({
    where,
    outFields: '*',
    outSR: '4326',
    f: 'json',
    resultRecordCount: '2000',
  });

  const resp = await fetch(`${url}?${params.toString()}`);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  const json = await resp.json();
  if (json.error) throw new Error(json.error.message || 'API Error');
  return json.features || [];
}

async function fetchAutoTheftsLive(): Promise<TheftRecord[]> {
  const cutoff = sixMonthsAgo();
  let features: unknown[];
  try {
    features = await fetchFromAPI(
      AUTO_THEFT_API,
      `MCI_CATEGORY='Auto Theft' AND OCC_DATE >= DATE '${cutoff}'`
    );
  } catch {
    // Fallback: fetch by year
    const year = currentYear();
    features = await fetchFromAPI(
      AUTO_THEFT_API,
      `MCI_CATEGORY='Auto Theft' AND OCC_YEAR >= ${year - 1}`
    );
  }
  return features.map(parseAutoRecord).filter(Boolean) as TheftRecord[];
}

async function fetchBikeTheftsLive(): Promise<TheftRecord[]> {
  const cutoff = sixMonthsAgo();
  let features: unknown[];
  try {
    features = await fetchFromAPI(
      BIKE_THEFT_API,
      `OCC_DATE >= DATE '${cutoff}'`
    );
  } catch {
    const year = currentYear();
    features = await fetchFromAPI(
      BIKE_THEFT_API,
      `OCC_YEAR >= ${year - 1}`
    );
  }
  return features.map(parseBikeRecord).filter(Boolean) as TheftRecord[];
}

async function fetchStaticJSON(path: string): Promise<TheftRecord[]> {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Static file not found: ${path}`);
  return resp.json();
}

export async function fetchAllData(): Promise<{
  records: TheftRecord[];
  source: 'static' | 'live';
}> {
  // Strategy: Static First, Live Fallback
  try {
    const [auto, bike] = await Promise.all([
      fetchStaticJSON('/data/auto_thefts.json'),
      fetchStaticJSON('/data/bike_thefts.json'),
    ]);
    const records = [...auto, ...bike].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return { records, source: 'static' };
  } catch {
    // Live fallback
    try {
      const [auto, bike] = await Promise.all([
        fetchAutoTheftsLive(),
        fetchBikeTheftsLive(),
      ]);
      const records = [...auto, ...bike].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return { records, source: 'live' };
    } catch (err) {
      throw new Error(
        `Failed to load data from both static files and live API. ${err instanceof Error ? err.message : ''}`
      );
    }
  }
}

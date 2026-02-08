import type { TheftRecord } from '../types';

// Generate realistic demo data for Toronto when API is unavailable
const NEIGHBOURHOODS = [
  'West Humber-Clairville', 'Mount Olive-Silverstone-Jamestown', 'Thistletown-Beaumond Heights',
  'Rexdale-Kipling', 'Elms-Old Rexdale', 'Kingsview Village-The Westway', 'Willowridge-Martingrove-Richview',
  'Humber Heights-Westmount', 'Edenbridge-Humber Valley', 'Princess-Rosethorn',
  'Eringate-Centennial-West Deane', 'Markland Wood', 'Etobicoke West Mall',
  'Islington-City Centre West', 'Kingsway South', 'Stonegate-Queensway',
  'Mimico', 'New Toronto', 'Long Branch', 'Alderwood',
  'The Kingsway', 'Humber Bay Shores', 'South Parkdale', 'High Park-Swansea',
  'High Park North', 'Roncesvalles', 'Junction Area', 'The Junction',
  'Dovercourt-Wallace Emerson-Junction', 'Little Portugal', 'Trinity-Bellwoods',
  'Palmerston-Little Italy', 'Dufferin Grove', 'Corso Italia-Davenport',
  'Casa Loma', 'Wychwood', 'Annex', 'University', 'Kensington-Chinatown',
  'Bay-Cloverhill', 'Church-Wellesley', 'North St. James Town', 'Cabbagetown-South St. James Town',
  'Regent Park', 'Moss Park', 'Waterfront Communities-The Island',
  'St. Lawrence-East Bayfront-The Islands', 'North Riverdale', 'Blake-Jones',
  'South Riverdale', 'East End-Danforth', 'The Beaches', 'Woodbine Corridor',
  'Greenwood-Coxwell', 'Danforth', 'Broadview North', 'Old East York',
  'Thorncliffe Park', 'Flemingdon Park', 'Don Valley Village', 'Parkwoods-Donalda',
  'Victoria Village', 'Wexford/Maryvale', 'Bendale', 'Agincourt South-Malvern West',
  'Agincourt North', 'Milliken', 'Scarborough Village', 'Guildwood',
  'West Hill', 'Centennial Scarborough', 'Highland Creek', 'Rouge',
  'Malvern', 'Morningside', 'Port Union', 'Woburn North',
  'York University Heights', 'Black Creek', 'Glenfield-Jane Heights',
  'Downsview-Roding-CFB', 'Bathurst Manor', 'Westminster-Branson',
  'Newtonbrook East', 'Newtonbrook West', 'Willowdale East', 'Willowdale West',
  'Lansing-Westgate', 'Bedford Park-Nortown', 'Lawrence Park North',
  'Lawrence Park South', 'Forest Hill North', 'Forest Hill South',
  'Yonge-Eglinton', 'Mount Pleasant East', 'Mount Pleasant West',
  'Yonge-St. Clair', 'Rosedale-Moore Park',
];

const PREMISE_TYPES = [
  'Outside', 'Apartment', 'House', 'Commercial', 'Parking Lot',
  'Other', 'Transit', 'Educational',
];

const STATUSES = ['UNFOUNDED', 'CLEAR', 'NOT CLEARED'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateRecords(): TheftRecord[] {
  const rand = seededRandom(42);
  const records: TheftRecord[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Toronto bounding box
  const LAT_MIN = 43.585;
  const LAT_MAX = 43.855;
  const LNG_MIN = -79.639;
  const LNG_MAX = -79.115;

  // Hotspot centers (higher concentration near downtown, North York, Scarborough)
  const hotspots = [
    { lat: 43.653, lng: -79.383, weight: 3.0 },  // Downtown
    { lat: 43.667, lng: -79.394, weight: 2.0 },  // Kensington
    { lat: 43.770, lng: -79.413, weight: 2.5 },  // North York Centre
    { lat: 43.773, lng: -79.258, weight: 2.0 },  // Scarborough
    { lat: 43.632, lng: -79.540, weight: 1.5 },  // Etobicoke
    { lat: 43.688, lng: -79.300, weight: 1.5 },  // East York / Danforth
    { lat: 43.710, lng: -79.398, weight: 1.8 },  // Midtown
    { lat: 43.645, lng: -79.445, weight: 1.2 },  // Liberty Village / Parkdale
    { lat: 43.786, lng: -79.470, weight: 1.5 },  // Jane/Finch area
    { lat: 43.725, lng: -79.310, weight: 1.3 },  // Don Mills
  ];

  for (let i = 0; i < 1800; i++) {
    const isAuto = rand() < 0.55;
    const type: 'auto' | 'bike' = isAuto ? 'auto' : 'bike';

    // Place near a hotspot with some scatter
    const hotspot = hotspots[Math.floor(rand() * hotspots.length)];
    const spread = 0.04 / hotspot.weight;
    let lat = hotspot.lat + (rand() - 0.5) * spread * 2;
    let lng = hotspot.lng + (rand() - 0.5) * spread * 3;

    // Clamp to Toronto
    lat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
    lng = Math.max(LNG_MIN, Math.min(LNG_MAX, lng));

    // Date within last 6 months
    const daysAgo = Math.floor(rand() * 180);
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Hour distribution: bikes peak midday, autos peak evening/night
    let hour: number;
    if (isAuto) {
      hour = rand() < 0.4
        ? Math.floor(rand() * 6 + 18) % 24  // 18-23
        : rand() < 0.6
          ? Math.floor(rand() * 6)            // 0-5
          : Math.floor(rand() * 12 + 6);      // 6-17
    } else {
      hour = rand() < 0.6
        ? Math.floor(rand() * 8 + 10)         // 10-17
        : Math.floor(rand() * 24);
    }

    const neighbourhood = NEIGHBOURHOODS[Math.floor(rand() * NEIGHBOURHOODS.length)];
    const premiseType = isAuto
      ? (rand() < 0.35 ? 'Outside' : rand() < 0.5 ? 'Parking Lot' : rand() < 0.7 ? 'House' : PREMISE_TYPES[Math.floor(rand() * PREMISE_TYPES.length)])
      : (rand() < 0.4 ? 'Outside' : rand() < 0.6 ? 'Apartment' : PREMISE_TYPES[Math.floor(rand() * PREMISE_TYPES.length)]);

    const status = STATUSES[Math.floor(rand() * STATUSES.length)];

    records.push({
      id: `${type}-demo-${i}`,
      type,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year: year || currentYear,
      month,
      day,
      hour,
      neighbourhood,
      premiseType,
      lat,
      lng,
      status,
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

let _cachedRecords: TheftRecord[] | null = null;

export function getDemoData(): TheftRecord[] {
  if (!_cachedRecords) {
    _cachedRecords = generateRecords();
  }
  return _cachedRecords;
}

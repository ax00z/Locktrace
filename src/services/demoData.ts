import type { TheftRecord } from '../types';

const NEIGHBOURHOODS = [
  'West Humber-Clairville', 'Mount Olive-Silverstone-Jamestown', 'Thistletown-Beaumond Heights',
  'Rexdale-Kipling', 'Elms-Old Rexdale', 'Kingsview Village-The Westway',
  'Humber Heights-Westmount', 'Edenbridge-Humber Valley', 'Princess-Rosethorn',
  'Islington-City Centre West', 'Kingsway South', 'Stonegate-Queensway',
  'Mimico', 'New Toronto', 'Long Branch', 'Alderwood',
  'Humber Bay Shores', 'South Parkdale', 'High Park-Swansea',
  'High Park North', 'Roncesvalles', 'Junction Area', 'The Junction',
  'Dovercourt-Wallace Emerson-Junction', 'Little Portugal', 'Trinity-Bellwoods',
  'Palmerston-Little Italy', 'Dufferin Grove', 'Corso Italia-Davenport',
  'Casa Loma', 'Wychwood', 'Annex', 'University', 'Kensington-Chinatown',
  'Bay-Cloverhill', 'Church-Wellesley', 'North St. James Town',
  'Regent Park', 'Moss Park', 'Waterfront Communities-The Island',
  'North Riverdale', 'South Riverdale', 'East End-Danforth', 'The Beaches',
  'Greenwood-Coxwell', 'Danforth', 'Broadview North', 'Old East York',
  'Thorncliffe Park', 'Flemingdon Park', 'Don Valley Village',
  'Victoria Village', 'Wexford/Maryvale', 'Bendale', 'Agincourt South-Malvern West',
  'Agincourt North', 'Milliken', 'Scarborough Village', 'Guildwood',
  'West Hill', 'Highland Creek', 'Rouge', 'Malvern', 'Morningside',
  'York University Heights', 'Black Creek', 'Glenfield-Jane Heights',
  'Downsview-Roding-CFB', 'Bathurst Manor', 'Westminster-Branson',
  'Newtonbrook East', 'Willowdale East', 'Willowdale West',
  'Lansing-Westgate', 'Bedford Park-Nortown', 'Lawrence Park North',
  'Forest Hill North', 'Forest Hill South', 'Yonge-Eglinton',
  'Mount Pleasant East', 'Yonge-St. Clair', 'Rosedale-Moore Park',
];

const PREMISE_TYPES = ['Outside', 'Apartment', 'House', 'Commercial', 'Parking Lot', 'Other', 'Transit', 'Educational'];
const STATUSES = ['UNFOUNDED', 'CLEAR', 'NOT CLEARED'];

function seeded(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generate(): TheftRecord[] {
  const rand = seeded(42);
  const records: TheftRecord[] = [];
  const now = new Date();

  const hotspots = [
    { lat: 43.653, lng: -79.383, w: 3.0 },
    { lat: 43.667, lng: -79.394, w: 2.0 },
    { lat: 43.770, lng: -79.413, w: 2.5 },
    { lat: 43.773, lng: -79.258, w: 2.0 },
    { lat: 43.632, lng: -79.540, w: 1.5 },
    { lat: 43.688, lng: -79.300, w: 1.5 },
    { lat: 43.710, lng: -79.398, w: 1.8 },
    { lat: 43.645, lng: -79.445, w: 1.2 },
    { lat: 43.786, lng: -79.470, w: 1.5 },
    { lat: 43.725, lng: -79.310, w: 1.3 },
  ];

  for (let i = 0; i < 900; i++) {
    const isAuto = rand() < 0.55;
    const type: 'auto' | 'bike' = isAuto ? 'auto' : 'bike';

    const hs = hotspots[Math.floor(rand() * hotspots.length)];
    const spread = 0.04 / hs.w;
    const lat = Math.max(43.585, Math.min(43.855, hs.lat + (rand() - 0.5) * spread * 2));
    const lng = Math.max(-79.639, Math.min(-79.115, hs.lng + (rand() - 0.5) * spread * 3));

    const daysAgo = Math.floor(rand() * 90);
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let hour: number;
    if (isAuto) {
      hour = rand() < 0.4 ? Math.floor(rand() * 6 + 18) % 24
        : rand() < 0.6 ? Math.floor(rand() * 6)
        : Math.floor(rand() * 12 + 6);
    } else {
      hour = rand() < 0.6 ? Math.floor(rand() * 8 + 10) : Math.floor(rand() * 24);
    }

    records.push({
      id: `${type}-demo-${i}`,
      type,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year, month, day, hour,
      neighbourhood: NEIGHBOURHOODS[Math.floor(rand() * NEIGHBOURHOODS.length)],
      premiseType: isAuto
        ? (rand() < 0.35 ? 'Outside' : rand() < 0.5 ? 'Parking Lot' : rand() < 0.7 ? 'House' : PREMISE_TYPES[Math.floor(rand() * PREMISE_TYPES.length)])
        : (rand() < 0.4 ? 'Outside' : rand() < 0.6 ? 'Apartment' : PREMISE_TYPES[Math.floor(rand() * PREMISE_TYPES.length)]),
      lat, lng,
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

let cached: TheftRecord[] | null = null;

export function getDemoData(): TheftRecord[] {
  if (!cached) cached = generate();
  return cached;
}

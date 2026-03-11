import type { SQLiteDatabase } from 'expo-sqlite';

export type BusStop = {
  id: string;
  name: string;
  code: string | null;
  area: string | null;
};

export type NearbyBusStop = BusStop & {
  distanceMeters: number;
};

type StopRow = {
  stop_id: string;
  name: string;
  code: string | null;
  area: string | null;
  lat: number;
  lon: number;
};

const SEARCH_RADIUS_METERS = 800;
const MAX_NEARBY_RESULTS = 12;
const STOP_PREFIX = '37000';

const toRadians = (value: number) => (value * Math.PI) / 180;

export const normalizeText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  }

  return `${Math.round(meters / 10) * 10} m`;
};

export const toStopSuffix = (stopId: string) => stopId.slice(-5);

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const rowToStop = (row: StopRow): BusStop => ({
  id: row.stop_id,
  name: row.name,
  code: row.code ?? null,
  area: row.area ?? null,
});

export async function getStopById(db: SQLiteDatabase, stopId: string) {
  const row = await db.getFirstAsync<StopRow>(
    `SELECT stop_id, name, code, area, lat, lon
     FROM stops
     WHERE stop_id = ?
     LIMIT 1`,
    [stopId],
  );

  return row ? rowToStop(row) : null;
}

export async function getStopByDigits(db: SQLiteDatabase, digits: string) {
  if (!/^\d{5}$/.test(digits)) {
    return null;
  }

  return getStopById(db, `${STOP_PREFIX}${digits}`);
}

export async function searchStops(db: SQLiteDatabase, rawQuery: string) {
  const query = normalizeText(rawQuery);
  if (!query) {
    return [] as BusStop[];
  }

  const rows = await db.getAllAsync<StopRow>(
    `SELECT stop_id, name, code, area, lat, lon
     FROM stops
     ORDER BY name ASC`,
  );

  return rows
    .map((row) => {
      const name = normalizeText(row.name);
      const area = normalizeText(row.area ?? '');
      const code = normalizeText(row.code ?? '');
      const suffix = toStopSuffix(row.stop_id);

      let rank = Number.POSITIVE_INFINITY;

      if (name === query) rank = 0;
      else if (name.startsWith(query)) rank = 1;
      else if (name.includes(query)) rank = 2;
      else if (area.startsWith(query)) rank = 3;
      else if (area.includes(query)) rank = 4;
      else if (code === query) rank = 5;
      else if (code.includes(query)) rank = 6;
      else if (suffix === query) rank = 7;
      else if (suffix.includes(query)) rank = 8;

      if (!Number.isFinite(rank)) {
        return null;
      }

      return {
        stop: rowToStop(row),
        rank,
      };
    })
    .filter((item): item is { stop: BusStop; rank: number } => item !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      return a.stop.name.localeCompare(b.stop.name);
    })
    .map((item) => item.stop);
}

export async function getNearbyStops(db: SQLiteDatabase, latitude: number, longitude: number) {
  const latRange = SEARCH_RADIUS_METERS / 111_320;
  const lonRange = SEARCH_RADIUS_METERS / (111_320 * Math.cos(toRadians(latitude)));

  const rows = await db.getAllAsync<StopRow>(
    `SELECT stop_id, name, code, area, lat, lon
     FROM stops
     WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?`,
    [latitude - latRange, latitude + latRange, longitude - lonRange, longitude + lonRange],
  );

  return rows
    .map((row) => ({
      ...rowToStop(row),
      distanceMeters: haversineMeters(latitude, longitude, row.lat, row.lon),
    }))
    .filter((stop) => stop.distanceMeters <= SEARCH_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, MAX_NEARBY_RESULTS) satisfies NearbyBusStop[];
}

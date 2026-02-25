import { Prisma, PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import {
  Bbox,
  FeedMetadata,
  TransportRepository,
} from '@transport/application';

const GTFS_TABLES = {
  agency: 'agency.txt',
  stops: 'stops.txt',
  routes: 'routes.txt',
  trips: 'trips.txt',
  stop_times: 'stop_times.txt',
  calendar: 'calendar.txt',
  calendar_dates: 'calendar_dates.txt',
  shapes: 'shapes.txt',
} as const;

const BATCH_SIZE = 1000;

export class PrismaTransportRepository implements TransportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureSchema(): Promise<void> {
    // Prisma migrations should create schema. This is a no-op to align with pipeline calls.
  }

  async getFeedMetadata(feedId: string): Promise<FeedMetadata | null> {
    const row = await this.prisma.gtfsFeed.findUnique({
      where: { feedId },
    });
    if (!row) {
      return null;
    }
    return {
      feedId: row.feedId,
      versionHash: row.versionHash ?? '',
      fetchedAt: row.fetchedAt?.toISOString() ?? '',
      loadedAt: row.loadedAt?.toISOString() ?? '',
    };
  }

  async upsertFeedMetadata(metadata: FeedMetadata): Promise<void> {
    await this.prisma.gtfsFeed.upsert({
      where: { feedId: metadata.feedId },
      update: {
        versionHash: metadata.versionHash,
        fetchedAt: metadata.fetchedAt ? new Date(metadata.fetchedAt) : null,
        loadedAt: metadata.loadedAt ? new Date(metadata.loadedAt) : null,
      },
      create: {
        feedId: metadata.feedId,
        versionHash: metadata.versionHash,
        fetchedAt: metadata.fetchedAt ? new Date(metadata.fetchedAt) : null,
        loadedAt: metadata.loadedAt ? new Date(metadata.loadedAt) : null,
      },
    });
  }

  async loadStaticFeedFromStaging(
    feedId: string,
    stagingDir: string
  ): Promise<void> {
    const feedDir = path.join(stagingDir, feedId);

    await this.loadAgency(feedId, path.join(feedDir, GTFS_TABLES.agency));
    await this.loadStops(feedId, path.join(feedDir, GTFS_TABLES.stops));
    await this.loadRoutes(feedId, path.join(feedDir, GTFS_TABLES.routes));
    await this.loadTrips(feedId, path.join(feedDir, GTFS_TABLES.trips));
    await this.loadStopTimes(feedId, path.join(feedDir, GTFS_TABLES.stop_times));
    await this.loadCalendar(feedId, path.join(feedDir, GTFS_TABLES.calendar));
    await this.loadCalendarDates(
      feedId,
      path.join(feedDir, GTFS_TABLES.calendar_dates)
    );
    await this.loadShapes(feedId, path.join(feedDir, GTFS_TABLES.shapes));
  }

  async importRealtimeCsv(filePath: string, feedId: string): Promise<number> {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) {
      return 0;
    }
    const data = records.map((record) => ({
      feedId,
      vehicleId: String(record.vehicle_id ?? ''),
      tripId: this.nullIfEmpty(record.trip_id),
      routeId: this.nullIfEmpty(record.route_id),
      timestamp: new Date(record.timestamp),
      lat: Number(record.lat),
      lon: Number(record.lon),
      bearing: this.numberOrNull(record.bearing),
      ingestedAt: new Date(),
    }));

    for (const batch of this.chunk(data, BATCH_SIZE)) {
      await this.prisma.vehiclePosition.createMany({ data: batch });
    }

    return data.length;
  }

  async refreshLatestVehiclePositions(): Promise<void> {
    await this.prisma.latestVehiclePosition.deleteMany();

    await this.prisma.$executeRaw`
      INSERT INTO latest_vehicle_positions
        (feed_id, vehicle_id, trip_id, route_id, timestamp, lat, lon, bearing, ingested_at)
      SELECT DISTINCT ON (feed_id, vehicle_id)
        feed_id, vehicle_id, trip_id, route_id, timestamp, lat, lon, bearing, ingested_at
      FROM vehicle_positions
      ORDER BY feed_id, vehicle_id, timestamp DESC;
    `;
  }

  async pruneRealtime(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.vehiclePosition.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    return result.count;
  }

  async queryStopsInBbox(bbox: Bbox, feedId?: string) {
    return this.prisma.stop.findMany({
      where: {
        feedId: feedId ?? undefined,
        stopLat: { gte: bbox.minLat, lte: bbox.maxLat },
        stopLon: { gte: bbox.minLon, lte: bbox.maxLon },
      },
    });
  }

  async queryRoutes(feedId?: string) {
    return this.prisma.route.findMany({
      where: { feedId: feedId ?? undefined },
    });
  }

  async queryLatestVehicles(feedId?: string) {
    return this.prisma.latestVehiclePosition.findMany({
      where: { feedId: feedId ?? undefined },
    });
  }

  async queryVehiclePositionsSince(sinceIso: string, feedId?: string) {
    return this.prisma.vehiclePosition.findMany({
      where: {
        feedId: feedId ?? undefined,
        timestamp: { gte: new Date(sinceIso) },
      },
    });
  }

  async queryDepartures(stopId: string, feedId?: string, limit = 50) {
    const feedFilter = feedId
      ? Prisma.sql`AND stop_times.feed_id = ${feedId}`
      : Prisma.empty;

    return this.prisma.$queryRaw`
      SELECT
        stop_times.stop_id,
        stop_times.departure_time,
        stop_times.arrival_time,
        stop_times.stop_sequence,
        trips.trip_id,
        trips.route_id,
        trips.trip_headsign,
        routes.route_short_name,
        routes.route_long_name,
        trips.direction_id
      FROM stop_times
      JOIN trips ON stop_times.trip_id = trips.trip_id AND stop_times.feed_id = trips.feed_id
      JOIN routes ON trips.route_id = routes.route_id AND trips.feed_id = routes.feed_id
      WHERE stop_times.stop_id = ${stopId}
      ${feedFilter}
      ORDER BY stop_times.departure_time
      LIMIT ${limit};
    `;
  }

  private async loadAgency(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.agency.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      agencyId: this.nullIfEmpty(record.agency_id),
      agencyName: this.nullIfEmpty(record.agency_name),
      agencyUrl: this.nullIfEmpty(record.agency_url),
      agencyTimezone: this.nullIfEmpty(record.agency_timezone),
    }));

    await this.insertBatches('agency', data);
  }

  private async loadStops(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.stop.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      stopId: String(record.stop_id ?? ''),
      stopName: this.nullIfEmpty(record.stop_name),
      stopLat: this.numberOrNull(record.stop_lat),
      stopLon: this.numberOrNull(record.stop_lon),
    }));

    await this.insertBatches('stop', data);
  }

  private async loadRoutes(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.route.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      routeId: String(record.route_id ?? ''),
      routeShortName: this.nullIfEmpty(record.route_short_name),
      routeLongName: this.nullIfEmpty(record.route_long_name),
    }));

    await this.insertBatches('route', data);
  }

  private async loadTrips(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.trip.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      tripId: String(record.trip_id ?? ''),
      routeId: this.nullIfEmpty(record.route_id),
      serviceId: this.nullIfEmpty(record.service_id),
      tripHeadsign: this.nullIfEmpty(record.trip_headsign),
      directionId: this.numberOrNull(record.direction_id),
    }));

    await this.insertBatches('trip', data);
  }

  private async loadStopTimes(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.stopTime.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      tripId: this.nullIfEmpty(record.trip_id),
      stopId: this.nullIfEmpty(record.stop_id),
      arrivalTime: this.nullIfEmpty(record.arrival_time),
      departureTime: this.nullIfEmpty(record.departure_time),
      stopSequence: this.numberOrNull(record.stop_sequence),
    }));

    await this.insertBatches('stopTime', data);
  }

  private async loadCalendar(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.calendar.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      serviceId: this.nullIfEmpty(record.service_id),
      monday: this.numberOrNull(record.monday),
      tuesday: this.numberOrNull(record.tuesday),
      wednesday: this.numberOrNull(record.wednesday),
      thursday: this.numberOrNull(record.thursday),
      friday: this.numberOrNull(record.friday),
      saturday: this.numberOrNull(record.saturday),
      sunday: this.numberOrNull(record.sunday),
      startDate: this.nullIfEmpty(record.start_date),
      endDate: this.nullIfEmpty(record.end_date),
    }));

    await this.insertBatches('calendar', data);
  }

  private async loadCalendarDates(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.calendarDate.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      serviceId: this.nullIfEmpty(record.service_id),
      date: this.nullIfEmpty(record.date),
      exceptionType: this.numberOrNull(record.exception_type),
    }));

    await this.insertBatches('calendarDate', data);
  }

  private async loadShapes(feedId: string, filePath: string) {
    const records = await this.parseCsvFile(filePath);
    if (records.length === 0) return;

    await this.prisma.shape.deleteMany({ where: { feedId } });
    const data = records.map((record) => ({
      feedId,
      shapeId: this.nullIfEmpty(record.shape_id),
      shapePtLat: this.numberOrNull(record.shape_pt_lat),
      shapePtLon: this.numberOrNull(record.shape_pt_lon),
      shapePtSequence: this.numberOrNull(record.shape_pt_sequence),
    }));

    await this.insertBatches('shape', data);
  }

  private async parseCsvFile(filePath: string) {
    try {
      const content = await readFile(filePath, 'utf8');
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>;
    } catch {
      return [] as Array<Record<string, string>>;
    }
  }

  private nullIfEmpty(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const text = String(value).trim();
    return text.length ? text : null;
  }

  private numberOrNull(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private async insertBatches(
    model:
      | 'agency'
      | 'stop'
      | 'route'
      | 'trip'
      | 'stopTime'
      | 'calendar'
      | 'calendarDate'
      | 'shape',
    data: Array<Record<string, unknown>>
  ) {
    for (const batch of this.chunk(data, BATCH_SIZE)) {
      await (this.prisma as any)[model].createMany({ data: batch });
    }
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }
}

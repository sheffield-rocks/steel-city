import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { FeedConfig } from '@transport/domain';
import { RealtimeCollector } from '@transport/application';
import { ProtobufGtfsRealtimeDecoder } from './protobuf-gtfs-rt.decoder';

@Injectable()
export class GtfsRealtimeCollector implements RealtimeCollector {
  private readonly logger = new Logger(GtfsRealtimeCollector.name);

  constructor(private readonly decoder: ProtobufGtfsRealtimeDecoder) {}

  async collectToCsv(
    feed: FeedConfig,
    options: { rtCsvDir: string; verbose?: boolean }
  ) {
    if (!feed.realtimeUrl) {
      return {
        feedId: feed.id,
        filePath: '',
        recordCount: 0,
      };
    }

    const headers: Record<string, string> = {};
    if (feed.apiKeyEnv) {
      const apiKey = process.env[feed.apiKeyEnv];
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
      }
    }

    const response = await fetch(feed.realtimeUrl, { headers });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch GTFS-RT feed ${feed.id}: ${response.status} ${response.statusText}`
      );
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    const message = this.decoder.decode(buffer);

    const rows: string[] = [];
    rows.push('feed_id,vehicle_id,trip_id,route_id,timestamp,lat,lon,bearing');

    const entities = message.entity ?? [];
    for (const entity of entities) {
      const vehicle = entity.vehicle;
      if (!vehicle || !vehicle.position) {
        continue;
      }

      const vehicleId =
        vehicle.vehicle?.id ?? vehicle.vehicle?.label ?? entity.id ?? '';
      const tripId = vehicle.trip?.trip_id ?? '';
      const routeId = vehicle.trip?.route_id ?? '';
      const timestampSeconds = vehicle.timestamp ?? message.header?.timestamp;
      if (!timestampSeconds) {
        continue;
      }
      const timestamp = new Date(Number(timestampSeconds) * 1000).toISOString();
      const lat = vehicle.position.latitude;
      const lon = vehicle.position.longitude;
      const bearing = vehicle.position.bearing ?? '';

      rows.push(
        [
          feed.id,
          vehicleId,
          tripId,
          routeId,
          timestamp,
          lat,
          lon,
          bearing,
        ]
          .map((value) => this.escapeCsv(String(value ?? '')))
          .join(',')
      );
    }

    await mkdir(options.rtCsvDir, { recursive: true });
    const fileName = `${feed.id}_${this.formatTimestamp(new Date())}.csv`;
    const filePath = path.join(options.rtCsvDir, fileName);
    await writeFile(filePath, rows.join('\n'), 'utf8');

    if (options.verbose) {
      this.logger.log(`Collected ${rows.length - 1} positions for ${feed.id}.`);
    }

    return {
      feedId: feed.id,
      filePath,
      recordCount: rows.length - 1,
    };
  }

  private formatTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

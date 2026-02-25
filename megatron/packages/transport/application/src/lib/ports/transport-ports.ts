import { FeedConfig, FeedId } from '@transport/domain';

export type StagedFeedMetadata = {
  feedId: FeedId;
  versionHash: string;
  fetchedAt: string;
};

export type StaticFetchResult = {
  feedId: FeedId;
  stagingDir: string;
  versionHash: string;
  fetchedAt: string;
  skipped: boolean;
};

export type RealtimeCollectResult = {
  feedId: FeedId;
  filePath: string;
  recordCount: number;
};

export type FeedMetadata = {
  feedId: FeedId;
  versionHash: string;
  fetchedAt: string;
  loadedAt: string;
};

export type CsvFileInfo = {
  feedId: FeedId;
  filePath: string;
};

export type Bbox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export type StopRow = Record<string, unknown>;
export type RouteRow = Record<string, unknown>;
export type VehicleRow = Record<string, unknown>;
export type VehiclePositionRow = Record<string, unknown>;
export type DepartureRow = Record<string, unknown>;

export interface FeedConfigRepository {
  listFeeds(configPath: string): Promise<FeedConfig[]>;
  getFeed(configPath: string, feedId: FeedId): Promise<FeedConfig | null>;
}

export interface StaticFeedFetcher {
  fetchToStaging(
    feed: FeedConfig,
    options: { stagingDir: string; verbose?: boolean }
  ): Promise<StaticFetchResult>;
}

export interface StagingStore {
  listStagedFeeds(stagingDir: string): Promise<FeedId[]>;
  readMetadata(
    stagingDir: string,
    feedId: FeedId
  ): Promise<StagedFeedMetadata | null>;
  writeMetadata(
    stagingDir: string,
    metadata: StagedFeedMetadata
  ): Promise<void>;
}

export interface RealtimeCollector {
  collectToCsv(
    feed: FeedConfig,
    options: { rtCsvDir: string; verbose?: boolean }
  ): Promise<RealtimeCollectResult>;
}

export interface CsvStore {
  listPending(rtCsvDir: string, feedId?: FeedId): Promise<CsvFileInfo[]>;
  remove(filePath: string): Promise<void>;
}

export interface TransportRepository {
  ensureSchema(): Promise<void>;
  getFeedMetadata(feedId: FeedId): Promise<FeedMetadata | null>;
  upsertFeedMetadata(metadata: FeedMetadata): Promise<void>;
  loadStaticFeedFromStaging(
    feedId: FeedId,
    stagingDir: string
  ): Promise<void>;
  importRealtimeCsv(filePath: string, feedId: FeedId): Promise<number>;
  refreshLatestVehiclePositions(): Promise<void>;
  pruneRealtime(days: number): Promise<number>;
  queryStopsInBbox(bbox: Bbox, feedId?: FeedId): Promise<StopRow[]>;
  queryRoutes(feedId?: FeedId): Promise<RouteRow[]>;
  queryLatestVehicles(feedId?: FeedId): Promise<VehicleRow[]>;
  queryVehiclePositionsSince(
    sinceIso: string,
    feedId?: FeedId
  ): Promise<VehiclePositionRow[]>;
  queryDepartures(
    stopId: string,
    feedId?: FeedId,
    limit?: number
  ): Promise<DepartureRow[]>;
}

export interface TransportRepositoryFactory {
  create(dbUrl: string): TransportRepository;
}

export const FEED_CONFIG_REPOSITORY = 'FEED_CONFIG_REPOSITORY';
export const STATIC_FEED_FETCHER = 'STATIC_FEED_FETCHER';
export const STAGING_STORE = 'STAGING_STORE';
export const REALTIME_COLLECTOR = 'REALTIME_COLLECTOR';
export const CSV_STORE = 'CSV_STORE';
export const TRANSPORT_REPOSITORY_FACTORY = 'TRANSPORT_REPOSITORY_FACTORY';

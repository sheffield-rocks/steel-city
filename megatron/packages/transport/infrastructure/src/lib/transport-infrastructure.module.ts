import { Global, Module } from '@nestjs/common';
import {
  CSV_STORE,
  FEED_CONFIG_REPOSITORY,
  REALTIME_COLLECTOR,
  STATIC_FEED_FETCHER,
  STAGING_STORE,
  TRANSPORT_REPOSITORY_FACTORY,
} from '@transport/application';
import { YamlFeedConfigRepository } from './config/yaml-feed-config.repository';
import { FileSystemCsvStore } from './csv/file-system-csv.store';
import { HttpGtfsStaticFetcher } from './gtfs/http-gtfs-static.fetcher';
import { GtfsRealtimeCollector } from './realtime/gtfs-rt.realtime-collector';
import { ProtobufGtfsRealtimeDecoder } from './realtime/protobuf-gtfs-rt.decoder';
import { FileSystemStagingStore } from './staging/file-system-staging.store';
import { PrismaTransportRepositoryFactory } from './prisma/prisma-repository.factory';

@Global()
@Module({
  providers: [
    YamlFeedConfigRepository,
    FileSystemStagingStore,
    HttpGtfsStaticFetcher,
    ProtobufGtfsRealtimeDecoder,
    GtfsRealtimeCollector,
    FileSystemCsvStore,
    PrismaTransportRepositoryFactory,
    { provide: FEED_CONFIG_REPOSITORY, useExisting: YamlFeedConfigRepository },
    { provide: STAGING_STORE, useExisting: FileSystemStagingStore },
    { provide: STATIC_FEED_FETCHER, useExisting: HttpGtfsStaticFetcher },
    { provide: REALTIME_COLLECTOR, useExisting: GtfsRealtimeCollector },
    { provide: CSV_STORE, useExisting: FileSystemCsvStore },
    {
      provide: TRANSPORT_REPOSITORY_FACTORY,
      useExisting: PrismaTransportRepositoryFactory,
    },
  ],
  exports: [
    FEED_CONFIG_REPOSITORY,
    STAGING_STORE,
    STATIC_FEED_FETCHER,
    REALTIME_COLLECTOR,
    CSV_STORE,
    TRANSPORT_REPOSITORY_FACTORY,
  ],
})
export class TransportInfrastructureModule {}

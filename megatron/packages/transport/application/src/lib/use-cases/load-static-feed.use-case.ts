import { Inject, Injectable } from '@nestjs/common';
import {
  FEED_CONFIG_REPOSITORY,
  FeedConfigRepository,
  STAGING_STORE,
  StagingStore,
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type LoadStaticFeedCommand = {
  configPath: string;
  dbUrl: string;
  stagingDir: string;
  feedId?: string;
  verbose?: boolean;
};

export type LoadStaticFeedResult = {
  feedId: string;
  loaded: boolean;
  reason?: string;
};

@Injectable()
export class LoadStaticFeedUseCase {
  constructor(
    @Inject(FEED_CONFIG_REPOSITORY)
    private readonly configRepository: FeedConfigRepository,
    @Inject(STAGING_STORE)
    private readonly stagingStore: StagingStore,
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(command: LoadStaticFeedCommand): Promise<LoadStaticFeedResult[]> {
    const repository = this.repositoryFactory.create(command.dbUrl);
    await repository.ensureSchema();

    const feeds = await this.configRepository.listFeeds(command.configPath);
    const selectedFeeds = command.feedId
      ? feeds.filter((feed) => feed.id === command.feedId)
      : feeds;

    const results: LoadStaticFeedResult[] = [];
    for (const feed of selectedFeeds) {
      const metadata = await this.stagingStore.readMetadata(
        command.stagingDir,
        feed.id
      );
      if (!metadata) {
        results.push({
          feedId: feed.id,
          loaded: false,
          reason: 'No staged metadata found',
        });
        continue;
      }

      const existing = await repository.getFeedMetadata(feed.id);
      if (existing && existing.versionHash === metadata.versionHash) {
        results.push({
          feedId: feed.id,
          loaded: false,
          reason: 'Feed version already loaded',
        });
        continue;
      }

      await repository.loadStaticFeedFromStaging(feed.id, command.stagingDir);
      await repository.upsertFeedMetadata({
        feedId: feed.id,
        versionHash: metadata.versionHash,
        fetchedAt: metadata.fetchedAt,
        loadedAt: new Date().toISOString(),
      });

      results.push({ feedId: feed.id, loaded: true });
    }

    return results;
  }
}

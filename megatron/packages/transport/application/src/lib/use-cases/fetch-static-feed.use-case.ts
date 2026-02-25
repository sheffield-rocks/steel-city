import { Inject, Injectable } from '@nestjs/common';
import {
  FEED_CONFIG_REPOSITORY,
  STATIC_FEED_FETCHER,
  FeedConfigRepository,
  StaticFeedFetcher,
  StaticFetchResult,
} from '../ports/transport-ports';

export type FetchStaticFeedCommand = {
  configPath: string;
  stagingDir: string;
  feedId?: string;
  verbose?: boolean;
};

@Injectable()
export class FetchStaticFeedUseCase {
  constructor(
    @Inject(FEED_CONFIG_REPOSITORY)
    private readonly configRepository: FeedConfigRepository,
    @Inject(STATIC_FEED_FETCHER)
    private readonly fetcher: StaticFeedFetcher
  ) {}

  async execute(command: FetchStaticFeedCommand): Promise<StaticFetchResult[]> {
    const feeds = await this.configRepository.listFeeds(command.configPath);
    const selectedFeeds = command.feedId
      ? feeds.filter((feed) => feed.id === command.feedId)
      : feeds;

    const results: StaticFetchResult[] = [];
    for (const feed of selectedFeeds) {
      results.push(
        await this.fetcher.fetchToStaging(feed, {
          stagingDir: command.stagingDir,
          verbose: command.verbose,
        })
      );
    }

    return results;
  }
}

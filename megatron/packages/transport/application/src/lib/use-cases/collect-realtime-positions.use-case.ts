import { Inject, Injectable } from '@nestjs/common';
import {
  FEED_CONFIG_REPOSITORY,
  FeedConfigRepository,
  REALTIME_COLLECTOR,
  RealtimeCollector,
  RealtimeCollectResult,
} from '../ports/transport-ports';

export type CollectRealtimePositionsCommand = {
  configPath: string;
  rtCsvDir: string;
  feedId?: string;
  verbose?: boolean;
};

@Injectable()
export class CollectRealtimePositionsUseCase {
  constructor(
    @Inject(FEED_CONFIG_REPOSITORY)
    private readonly configRepository: FeedConfigRepository,
    @Inject(REALTIME_COLLECTOR)
    private readonly collector: RealtimeCollector
  ) {}

  async execute(
    command: CollectRealtimePositionsCommand
  ): Promise<RealtimeCollectResult[]> {
    const feeds = await this.configRepository.listFeeds(command.configPath);
    const selectedFeeds = command.feedId
      ? feeds.filter((feed) => feed.id === command.feedId)
      : feeds;

    const results: RealtimeCollectResult[] = [];
    for (const feed of selectedFeeds) {
      if (!feed.realtimeUrl) {
        continue;
      }
      results.push(
        await this.collector.collectToCsv(feed, {
          rtCsvDir: command.rtCsvDir,
          verbose: command.verbose,
        })
      );
    }

    return results;
  }
}

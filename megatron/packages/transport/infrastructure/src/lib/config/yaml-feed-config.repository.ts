import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import { FeedConfig, FeedConfigFile } from '@transport/domain';
import { FeedConfigRepository } from '@transport/application';
import { Injectable } from '@nestjs/common';

@Injectable()
export class YamlFeedConfigRepository implements FeedConfigRepository {
  async listFeeds(configPath: string): Promise<FeedConfig[]> {
    const content = await readFile(configPath, 'utf8');
    const parsed = YAML.parse(content) as FeedConfigFile;
    if (!parsed || !Array.isArray(parsed.feeds)) {
      return [];
    }

    return parsed.feeds.map((feed) => ({
      id: feed.id,
      name: feed.name,
      staticUrl: feed.staticUrl ?? (feed as any).static_url ?? '',
      realtimeUrl: feed.realtimeUrl ?? (feed as any).realtime_url,
      apiKeyEnv: feed.apiKeyEnv ?? (feed as any).api_key_env,
    }));
  }

  async getFeed(
    configPath: string,
    feedId: string
  ): Promise<FeedConfig | null> {
    const feeds = await this.listFeeds(configPath);
    return feeds.find((feed) => feed.id === feedId) ?? null;
  }
}

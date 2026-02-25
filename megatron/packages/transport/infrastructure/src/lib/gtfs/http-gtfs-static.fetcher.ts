import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeedConfig } from '@transport/domain';
import {
  StaticFeedFetcher,
  StaticFetchResult,
  StagingStore,
  STAGING_STORE,
} from '@transport/application';

@Injectable()
export class HttpGtfsStaticFetcher implements StaticFeedFetcher {
  private readonly logger = new Logger(HttpGtfsStaticFetcher.name);

  constructor(
    @Inject(STAGING_STORE) private readonly stagingStore: StagingStore
  ) {}

  async fetchToStaging(
    feed: FeedConfig,
    options: { stagingDir: string; verbose?: boolean }
  ): Promise<StaticFetchResult> {
    const feedDir = path.join(options.stagingDir, feed.id);
    await mkdir(feedDir, { recursive: true });

    const headers: Record<string, string> = {};
    if (feed.apiKeyEnv) {
      const apiKey = process.env[feed.apiKeyEnv];
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
      }
    }

    const response = await fetch(feed.staticUrl, { headers });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch GTFS feed ${feed.id}: ${response.status} ${response.statusText}`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const versionHash = createHash('sha256').update(buffer).digest('hex');
    const fetchedAt = new Date().toISOString();

    const existing = await this.stagingStore.readMetadata(
      options.stagingDir,
      feed.id
    );
    if (existing && existing.versionHash === versionHash) {
      if (options.verbose) {
        this.logger.log(`Feed ${feed.id} unchanged; skipping extraction.`);
      }
      return {
        feedId: feed.id,
        stagingDir: feedDir,
        versionHash,
        fetchedAt: existing.fetchedAt,
        skipped: true,
      };
    }

    const zipPath = path.join(feedDir, 'feed.zip');
    await writeFile(zipPath, buffer);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(feedDir, true);

    await this.stagingStore.writeMetadata(options.stagingDir, {
      feedId: feed.id,
      versionHash,
      fetchedAt,
    });

    if (options.verbose) {
      this.logger.log(`Fetched and extracted feed ${feed.id}.`);
    }

    return {
      feedId: feed.id,
      stagingDir: feedDir,
      versionHash,
      fetchedAt,
      skipped: false,
    };
  }
}

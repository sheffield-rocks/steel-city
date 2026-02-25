import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import {
  StagedFeedMetadata,
  StagingStore,
} from '@transport/application';

@Injectable()
export class FileSystemStagingStore implements StagingStore {
  async listStagedFeeds(stagingDir: string): Promise<string[]> {
    try {
      const entries = await readdir(stagingDir, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  async readMetadata(
    stagingDir: string,
    feedId: string
  ): Promise<StagedFeedMetadata | null> {
    const metadataPath = path.join(stagingDir, feedId, 'metadata.json');
    try {
      const content = await readFile(metadataPath, 'utf8');
      const parsed = JSON.parse(content) as StagedFeedMetadata;
      if (!parsed?.feedId || !parsed?.versionHash) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async writeMetadata(
    stagingDir: string,
    metadata: StagedFeedMetadata
  ): Promise<void> {
    const feedDir = path.join(stagingDir, metadata.feedId);
    await mkdir(feedDir, { recursive: true });
    const metadataPath = path.join(feedDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }
}

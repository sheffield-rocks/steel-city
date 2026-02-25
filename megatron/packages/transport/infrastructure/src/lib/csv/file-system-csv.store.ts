import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { CsvFileInfo, CsvStore } from '@transport/application';

@Injectable()
export class FileSystemCsvStore implements CsvStore {
  async listPending(rtCsvDir: string, feedId?: string): Promise<CsvFileInfo[]> {
    try {
      const entries = await readdir(rtCsvDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.csv'))
        .map((entry) => ({
          feedId: this.parseFeedId(entry.name),
          filePath: path.join(rtCsvDir, entry.name),
        }))
        .filter((file) => (feedId ? file.feedId === feedId : true))
        .sort((a, b) => a.filePath.localeCompare(b.filePath));
    } catch {
      return [];
    }
  }

  async remove(filePath: string): Promise<void> {
    await unlink(filePath);
  }

  private parseFeedId(filename: string): string {
    const underscoreIndex = filename.indexOf('_');
    if (underscoreIndex === -1) {
      return filename.replace(/\.csv$/, '');
    }
    return filename.slice(0, underscoreIndex);
  }
}

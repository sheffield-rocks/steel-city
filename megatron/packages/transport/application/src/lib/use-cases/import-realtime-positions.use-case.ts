import { Inject, Injectable } from '@nestjs/common';
import {
  CSV_STORE,
  CsvStore,
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type ImportRealtimePositionsCommand = {
  dbUrl: string;
  rtCsvDir: string;
  feedId?: string;
  verbose?: boolean;
};

export type ImportRealtimePositionsResult = {
  importedFiles: number;
  importedRows: number;
};

@Injectable()
export class ImportRealtimePositionsUseCase {
  constructor(
    @Inject(CSV_STORE)
    private readonly csvStore: CsvStore,
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(
    command: ImportRealtimePositionsCommand
  ): Promise<ImportRealtimePositionsResult> {
    const repository = this.repositoryFactory.create(command.dbUrl);
    await repository.ensureSchema();

    const pending = await this.csvStore.listPending(
      command.rtCsvDir,
      command.feedId
    );

    let importedRows = 0;
    for (const file of pending) {
      importedRows += await repository.importRealtimeCsv(
        file.filePath,
        file.feedId
      );
      await this.csvStore.remove(file.filePath);
    }

    if (pending.length > 0) {
      await repository.refreshLatestVehiclePositions();
    }

    return { importedFiles: pending.length, importedRows };
  }
}

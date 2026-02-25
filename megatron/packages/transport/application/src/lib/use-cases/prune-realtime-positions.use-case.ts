import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type PruneRealtimePositionsCommand = {
  dbUrl: string;
  days: number;
};

@Injectable()
export class PruneRealtimePositionsUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(command: PruneRealtimePositionsCommand): Promise<number> {
    const repository = this.repositoryFactory.create(command.dbUrl);
    await repository.ensureSchema();
    return repository.pruneRealtime(command.days);
  }
}

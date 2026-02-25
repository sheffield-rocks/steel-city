import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type GetLatestVehiclesQuery = {
  dbUrl: string;
  feedId?: string;
};

@Injectable()
export class GetLatestVehiclesUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(query: GetLatestVehiclesQuery) {
    const repository = this.repositoryFactory.create(query.dbUrl);
    await repository.ensureSchema();
    return repository.queryLatestVehicles(query.feedId);
  }
}

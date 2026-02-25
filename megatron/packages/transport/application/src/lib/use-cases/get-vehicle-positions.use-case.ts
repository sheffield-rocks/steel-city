import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type GetVehiclePositionsQuery = {
  dbUrl: string;
  sinceIso: string;
  feedId?: string;
};

@Injectable()
export class GetVehiclePositionsUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(query: GetVehiclePositionsQuery) {
    const repository = this.repositoryFactory.create(query.dbUrl);
    await repository.ensureSchema();
    return repository.queryVehiclePositionsSince(query.sinceIso, query.feedId);
  }
}

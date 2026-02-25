import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type GetDeparturesQuery = {
  dbUrl: string;
  stopId: string;
  feedId?: string;
  limit?: number;
};

@Injectable()
export class GetDeparturesUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(query: GetDeparturesQuery) {
    const repository = this.repositoryFactory.create(query.dbUrl);
    await repository.ensureSchema();
    return repository.queryDepartures(
      query.stopId,
      query.feedId,
      query.limit
    );
  }
}

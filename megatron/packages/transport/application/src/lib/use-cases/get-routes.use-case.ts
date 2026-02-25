import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type GetRoutesQuery = {
  dbUrl: string;
  feedId?: string;
};

@Injectable()
export class GetRoutesUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(query: GetRoutesQuery) {
    const repository = this.repositoryFactory.create(query.dbUrl);
    await repository.ensureSchema();
    return repository.queryRoutes(query.feedId);
  }
}

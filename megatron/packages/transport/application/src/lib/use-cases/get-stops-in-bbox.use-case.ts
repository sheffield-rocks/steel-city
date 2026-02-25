import { Inject, Injectable } from '@nestjs/common';
import {
  Bbox,
  TRANSPORT_REPOSITORY_FACTORY,
  TransportRepositoryFactory,
} from '../ports/transport-ports';

export type GetStopsInBboxQuery = {
  dbUrl: string;
  bbox: Bbox;
  feedId?: string;
};

@Injectable()
export class GetStopsInBboxUseCase {
  constructor(
    @Inject(TRANSPORT_REPOSITORY_FACTORY)
    private readonly repositoryFactory: TransportRepositoryFactory
  ) {}

  async execute(query: GetStopsInBboxQuery) {
    const repository = this.repositoryFactory.create(query.dbUrl);
    await repository.ensureSchema();
    return repository.queryStopsInBbox(query.bbox, query.feedId);
  }
}

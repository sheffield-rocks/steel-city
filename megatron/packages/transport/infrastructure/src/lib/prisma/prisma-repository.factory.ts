import { Injectable } from '@nestjs/common';
import { TransportRepository, TransportRepositoryFactory } from '@transport/application';
import { PrismaTransportRepository } from './prisma-transport.repository';
import { getPrismaClient } from './prisma-client.manager';

@Injectable()
export class PrismaTransportRepositoryFactory implements TransportRepositoryFactory {
  create(dbUrl: string): TransportRepository {
    const client = getPrismaClient(dbUrl);
    return new PrismaTransportRepository(client);
  }
}

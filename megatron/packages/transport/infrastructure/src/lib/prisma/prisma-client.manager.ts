import { PrismaClient } from '@prisma/client';

const clients = new Map<string, PrismaClient>();

export function getPrismaClient(databaseUrl: string): PrismaClient {
  const url = databaseUrl || process.env.DATABASE_URL || '';
  if (!url) {
    throw new Error('DATABASE_URL must be set for Prisma connection');
  }
  if (!clients.has(url)) {
    clients.set(url, new PrismaClient({
      datasources: {
        db: { url },
      },
    }));
  }
  return clients.get(url)!;
}

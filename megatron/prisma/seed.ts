import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS latest_vehicle_positions_feed_vehicle
    ON latest_vehicle_positions (feed_id, vehicle_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS vehicle_positions_feed_timestamp
    ON vehicle_positions (feed_id, timestamp);
  `;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

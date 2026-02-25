import { Command } from 'commander';
import { NestFactory } from '@nestjs/core';
import { TransportCliModule } from './app/transport-cli.module';
import {
  CollectRealtimePositionsUseCase,
  FetchStaticFeedUseCase,
  ImportRealtimePositionsUseCase,
  LoadStaticFeedUseCase,
  PruneRealtimePositionsUseCase,
} from '@transport/application';

const DEFAULT_CONFIG =
  process.env.TRANSPORT_CONFIG_PATH ?? './config.yaml';
const DEFAULT_DB =
  process.env.TRANSPORT_DB_URL ?? process.env.DATABASE_URL ?? '';
const DEFAULT_STAGING =
  process.env.TRANSPORT_STAGING_DIR ?? './data/staging';
const DEFAULT_RT = process.env.TRANSPORT_RT_DIR ?? './data/rt-csv';

async function bootstrap() {
  const program = new Command();
  program
    .name('transport-cli')
    .description('Transport ingestion and API tooling')
    .version('0.1.0');

  program
    .command('static-fetch')
    .description('Download GTFS static feed and stage files')
    .option('-c, --config <path>', 'Path to config file', DEFAULT_CONFIG)
    .option('-s, --staging-dir <path>', 'Staging directory', DEFAULT_STAGING)
    .option('-f, --feed <feedId>', 'Feed ID to target')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (options) => {
      const app = await NestFactory.createApplicationContext(TransportCliModule);
      const useCase = app.get(FetchStaticFeedUseCase);
      const results = await useCase.execute({
        configPath: options.config,
        stagingDir: options.stagingDir,
        feedId: options.feed,
        verbose: options.verbose,
      });
      results.forEach((result) => {
        const status = result.skipped ? 'skipped' : 'fetched';
        console.log(`${result.feedId}: ${status} (${result.versionHash})`);
      });
      await app.close();
    });

  program
    .command('static-load')
    .description('Load staged GTFS static feed into Postgres')
    .option('-c, --config <path>', 'Path to config file', DEFAULT_CONFIG)
    .option('-s, --staging-dir <path>', 'Staging directory', DEFAULT_STAGING)
    .option('-d, --db <url>', 'Postgres connection url', DEFAULT_DB)
    .option('-f, --feed <feedId>', 'Feed ID to target')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (options) => {
      const app = await NestFactory.createApplicationContext(TransportCliModule);
      const useCase = app.get(LoadStaticFeedUseCase);
      const results = await useCase.execute({
        configPath: options.config,
        dbUrl: options.db,
        stagingDir: options.stagingDir,
        feedId: options.feed,
        verbose: options.verbose,
      });
      results.forEach((result) => {
        console.log(
          `${result.feedId}: ${result.loaded ? 'loaded' : 'skipped'}${result.reason ? ` (${result.reason})` : ''}`
        );
      });
      await app.close();
    });

  program
    .command('rt-collect')
    .description('Collect GTFS-RT vehicle positions to CSV')
    .option('-c, --config <path>', 'Path to config file', DEFAULT_CONFIG)
    .option('-r, --rt-dir <path>', 'Realtime CSV directory', DEFAULT_RT)
    .option('-f, --feed <feedId>', 'Feed ID to target')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (options) => {
      const app = await NestFactory.createApplicationContext(TransportCliModule);
      const useCase = app.get(CollectRealtimePositionsUseCase);
      const results = await useCase.execute({
        configPath: options.config,
        rtCsvDir: options.rtDir,
        feedId: options.feed,
        verbose: options.verbose,
      });
      results.forEach((result) => {
        console.log(
          `${result.feedId}: wrote ${result.recordCount} rows to ${result.filePath}`
        );
      });
      await app.close();
    });

  program
    .command('rt-import')
    .description('Import pending GTFS-RT CSV files into Postgres')
    .option('-d, --db <url>', 'Postgres connection url', DEFAULT_DB)
    .option('-r, --rt-dir <path>', 'Realtime CSV directory', DEFAULT_RT)
    .option('-f, --feed <feedId>', 'Feed ID to target')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (options) => {
      const app = await NestFactory.createApplicationContext(TransportCliModule);
      const useCase = app.get(ImportRealtimePositionsUseCase);
      const result = await useCase.execute({
        dbUrl: options.db,
        rtCsvDir: options.rtDir,
        feedId: options.feed,
        verbose: options.verbose,
      });
      console.log(
        `Imported ${result.importedFiles} files, ${result.importedRows} rows.`
      );
      await app.close();
    });

  program
    .command('rt-prune')
    .description('Prune realtime vehicle positions older than N days')
    .option('-d, --db <url>', 'Postgres connection url', DEFAULT_DB)
    .option('--days <days>', 'Retention days', '30')
    .action(async (options) => {
      const app = await NestFactory.createApplicationContext(TransportCliModule);
      const useCase = app.get(PruneRealtimePositionsUseCase);
      const removed = await useCase.execute({
        dbUrl: options.db,
        days: Number(options.days),
      });
      console.log(`Removed ${removed} rows.`);
      await app.close();
    });

  await program.parseAsync(process.argv);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

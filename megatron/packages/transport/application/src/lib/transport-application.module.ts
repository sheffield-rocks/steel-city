import { Module } from '@nestjs/common';
import { CollectRealtimePositionsUseCase } from './use-cases/collect-realtime-positions.use-case';
import { FetchStaticFeedUseCase } from './use-cases/fetch-static-feed.use-case';
import { GetDeparturesUseCase } from './use-cases/get-departures.use-case';
import { GetLatestVehiclesUseCase } from './use-cases/get-latest-vehicles.use-case';
import { GetRoutesUseCase } from './use-cases/get-routes.use-case';
import { GetStopsInBboxUseCase } from './use-cases/get-stops-in-bbox.use-case';
import { GetVehiclePositionsUseCase } from './use-cases/get-vehicle-positions.use-case';
import { ImportRealtimePositionsUseCase } from './use-cases/import-realtime-positions.use-case';
import { LoadStaticFeedUseCase } from './use-cases/load-static-feed.use-case';
import { PruneRealtimePositionsUseCase } from './use-cases/prune-realtime-positions.use-case';

const useCases = [
  FetchStaticFeedUseCase,
  LoadStaticFeedUseCase,
  CollectRealtimePositionsUseCase,
  ImportRealtimePositionsUseCase,
  PruneRealtimePositionsUseCase,
  GetStopsInBboxUseCase,
  GetRoutesUseCase,
  GetLatestVehiclesUseCase,
  GetVehiclePositionsUseCase,
  GetDeparturesUseCase,
];

@Module({
  providers: [...useCases],
  exports: [...useCases],
})
export class TransportApplicationModule {}

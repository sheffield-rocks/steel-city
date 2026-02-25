import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  GetDeparturesUseCase,
  GetLatestVehiclesUseCase,
  GetRoutesUseCase,
  GetStopsInBboxUseCase,
  GetVehiclePositionsUseCase,
} from '@transport/application';

const DEFAULT_DB =
  process.env.TRANSPORT_DB_URL ?? process.env.DATABASE_URL ?? '';

@Controller()
export class TransportController {
  constructor(
    private readonly getStopsInBbox: GetStopsInBboxUseCase,
    private readonly getRoutes: GetRoutesUseCase,
    private readonly getLatestVehicles: GetLatestVehiclesUseCase,
    private readonly getVehiclePositions: GetVehiclePositionsUseCase,
    private readonly getDepartures: GetDeparturesUseCase
  ) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('stops')
  async getStops(
    @Query('bbox') bboxParam?: string,
    @Query('feed_id') feedIdQuery?: string,
    @Query('feedId') feedIdAlt?: string
  ) {
    if (!bboxParam) {
      throw new BadRequestException('bbox is required');
    }
    const bbox = this.parseBbox(bboxParam);
    const feedId = feedIdQuery ?? feedIdAlt;
    return this.getStopsInBbox.execute({
      dbUrl: DEFAULT_DB,
      bbox,
      feedId,
    });
  }

  @Get('routes')
  async getRoutesEndpoint(
    @Query('feed_id') feedIdQuery?: string,
    @Query('feedId') feedIdAlt?: string
  ) {
    const feedId = feedIdQuery ?? feedIdAlt;
    return this.getRoutes.execute({ dbUrl: DEFAULT_DB, feedId });
  }

  @Get('vehicles')
  async getVehiclesEndpoint(
    @Query('feed_id') feedIdQuery?: string,
    @Query('feedId') feedIdAlt?: string
  ) {
    const feedId = feedIdQuery ?? feedIdAlt;
    return this.getLatestVehicles.execute({ dbUrl: DEFAULT_DB, feedId });
  }

  @Get('vehicle-positions')
  async getVehiclePositionsEndpoint(
    @Query('since') since?: string,
    @Query('feed_id') feedIdQuery?: string,
    @Query('feedId') feedIdAlt?: string
  ) {
    if (!since) {
      throw new BadRequestException('since is required (ISO timestamp)');
    }
    const feedId = feedIdQuery ?? feedIdAlt;
    return this.getVehiclePositions.execute({
      dbUrl: DEFAULT_DB,
      sinceIso: since,
      feedId,
    });
  }

  @Get('departures')
  async getDeparturesEndpoint(
    @Query('stop_id') stopIdQuery?: string,
    @Query('stopId') stopIdAlt?: string,
    @Query('feed_id') feedIdQuery?: string,
    @Query('feedId') feedIdAlt?: string,
    @Query('limit') limitParam?: string
  ) {
    const stopId = stopIdQuery ?? stopIdAlt;
    if (!stopId) {
      throw new BadRequestException('stop_id is required');
    }
    const feedId = feedIdQuery ?? feedIdAlt;
    const limit = limitParam ? Number(limitParam) : undefined;
    return this.getDepartures.execute({
      dbUrl: DEFAULT_DB,
      stopId,
      feedId,
      limit,
    });
  }

  private parseBbox(bboxParam: string) {
    const parts = bboxParam.split(',').map((value) => Number(value));
    if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
      throw new BadRequestException(
        'bbox must be four comma-separated numbers: minLon,minLat,maxLon,maxLat'
      );
    }
    const [minLon, minLat, maxLon, maxLat] = parts;
    return { minLon, minLat, maxLon, maxLat };
  }
}

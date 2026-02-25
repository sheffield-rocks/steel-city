import { FeedId } from './feed';

export type VehiclePosition = {
  feedId: FeedId;
  vehicleId: string;
  tripId?: string;
  routeId?: string;
  timestamp: string;
  lat: number;
  lon: number;
  bearing?: number;
};

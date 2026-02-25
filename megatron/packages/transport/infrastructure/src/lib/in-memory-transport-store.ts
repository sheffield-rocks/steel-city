import { TransportMode } from '@transport/domain';

export class InMemoryTransportStore {
  private readonly availableModes: TransportMode[] = ['bus', 'tram', 'train'];

  listModes(): TransportMode[] {
    return [...this.availableModes];
  }
}

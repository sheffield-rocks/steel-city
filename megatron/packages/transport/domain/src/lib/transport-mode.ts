export const TRANSPORT_MODES = ['bus', 'tram', 'train'] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];

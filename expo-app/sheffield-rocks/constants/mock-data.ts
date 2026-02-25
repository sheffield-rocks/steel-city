export type MockBusStop = {
  id: string;
  name: string;
  code: string | null;
  area: string | null;
  distanceMeters: number;
};

export type MockEvent = {
  id: number;
  title: string;
  url: string;
  publishedAt: number | null;
  firstSeenAt: number;
};

export const mockBusStops: MockBusStop[] = [
  {
    id: 'D1',
    name: 'City Hall Interchange',
    code: 'S1',
    area: 'City Centre',
    distanceMeters: 120,
  },
  {
    id: 'D2',
    name: 'Arundel Gate',
    code: 'AG2',
    area: 'Cultural Quarter',
    distanceMeters: 260,
  },
  {
    id: 'D3',
    name: 'West Street',
    code: 'W3',
    area: 'Devonshire Quarter',
    distanceMeters: 420,
  },
  {
    id: 'D4',
    name: 'Kelham Island Museum',
    code: null,
    area: 'Kelham Island',
    distanceMeters: 610,
  },
  {
    id: 'D5',
    name: 'Meadowhall Interchange',
    code: 'M1',
    area: 'Sheffield North',
    distanceMeters: 760,
  },
  {
    id: 'D6',
    name: 'Sheffield Station',
    code: 'SS',
    area: 'Station Road',
    distanceMeters: 790,
  },
];

const ts = (value: string) => new Date(value).getTime();

export const mockEvents: MockEvent[] = [
  {
    id: 9001,
    title: 'Winter Lights Trail at Peace Gardens',
    url: 'https://example.com/events/winter-lights-trail',
    publishedAt: ts('2026-01-18T18:30:00Z'),
    firstSeenAt: ts('2026-01-17T10:00:00Z'),
  },
  {
    id: 9002,
    title: 'Live Jazz Sessions at The Old Workshop',
    url: 'https://example.com/events/jazz-sessions',
    publishedAt: ts('2026-01-19T19:00:00Z'),
    firstSeenAt: ts('2026-01-17T12:00:00Z'),
  },
  {
    id: 9003,
    title: 'Late Night Market at Castle Square',
    url: 'https://example.com/events/late-night-market',
    publishedAt: ts('2026-01-20T17:00:00Z'),
    firstSeenAt: ts('2026-01-17T13:00:00Z'),
  },
  {
    id: 9004,
    title: 'Sheffield Comedy Cellar: Friday Showcase',
    url: 'https://example.com/events/comedy-cellar',
    publishedAt: ts('2026-01-23T19:30:00Z'),
    firstSeenAt: ts('2026-01-18T09:00:00Z'),
  },
  {
    id: 9005,
    title: 'Electronic Night: City Basement Sessions',
    url: 'https://example.com/events/basement-sessions',
    publishedAt: ts('2026-01-24T21:00:00Z'),
    firstSeenAt: ts('2026-01-18T11:30:00Z'),
  },
  {
    id: 9006,
    title: 'Theatre Late: Modern Drama at The Crucible',
    url: 'https://example.com/events/crucible-drama',
    publishedAt: ts('2026-01-26T19:00:00Z'),
    firstSeenAt: ts('2026-01-19T09:00:00Z'),
  },
];

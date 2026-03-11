import { SQLiteProvider } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

const STOPS_DATABASE = 'stops.sqlite';
const STOPS_ASSET = require('@/assets/data/stops.sqlite');

export function StopsDatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={STOPS_DATABASE} assetSource={{ assetId: STOPS_ASSET }}>
      {children}
    </SQLiteProvider>
  );
}

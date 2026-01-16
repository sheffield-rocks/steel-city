import { SQLiteProvider } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

const EVENTS_DATABASE = 'events.sqlite';
const EVENTS_ASSET = require('@/assets/data/events.sqlite');

export function EventsDatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={EVENTS_DATABASE} assetSource={{ assetId: EVENTS_ASSET }}>
      {children}
    </SQLiteProvider>
  );
}

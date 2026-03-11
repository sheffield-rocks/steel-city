import { Stack } from 'expo-router';

import { StopsDatabaseProvider } from '@/components/buses/stops-database-provider';

export default function BusesLayout() {
  return (
    <StopsDatabaseProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </StopsDatabaseProvider>
  );
}

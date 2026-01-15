import Storage from 'expo-sqlite/kv-store';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const LOCATION_PERMISSION_KEY = 'location_permission_requested_v1';

export function useLocationPermissionOnFirstOpen() {
  useEffect(() => {
    let cancelled = false;

    const requestOnce = async () => {
      try {
        const alreadyRequested = await Storage.getItem(LOCATION_PERMISSION_KEY);
        if (alreadyRequested || cancelled) {
          return;
        }

        if (Platform.OS !== 'web') {
          await Location.requestForegroundPermissionsAsync();
        }

        await Storage.setItem(LOCATION_PERMISSION_KEY, '1');
      } catch (error) {
        console.warn('Failed to request location permission on first open:', error);
      }
    };

    requestOnce();

    return () => {
      cancelled = true;
    };
  }, []);
}

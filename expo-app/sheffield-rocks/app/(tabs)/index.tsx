import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type BusStop = {
  id: string;
  name: string;
  address: string;
  distanceMeters: number;
  routes: string[];
};

type PermissionState = 'unknown' | 'granted' | 'denied';

const SEARCH_RADIUS_METERS = 800;
const MAX_RESULTS = 12;

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  }
  return `${Math.round(meters / 10) * 10} m`;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const surfaceSubtle = useThemeColor({ light: undefined, dark: undefined }, 'surfaceSubtle');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const pill = useThemeColor({ light: undefined, dark: undefined }, 'pill');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const success = useThemeColor({ light: undefined, dark: undefined }, 'success');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  const [stops, setStops] = useState<BusStop[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNearbyStops = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setPermissionState('denied');
        setStops([]);
        return;
      }

      setPermissionState('granted');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const query = `[out:json];node["highway"="bus_stop"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});out;`;
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error('Unable to load nearby stops.');
      }
      const data = (await response.json()) as {
        elements?: Array<{
          id: number;
          lat: number;
          lon: number;
          tags?: Record<string, string>;
        }>;
      };

      const elements = data.elements ?? [];
      const parsedStops = elements
        .map((element) => {
          const tags = element.tags ?? {};
          const routesRaw = tags.route_ref ?? tags.routes ?? '';
          const routes = routesRaw
            .split(/[;,]/)
            .map((route) => route.trim())
            .filter(Boolean);
          const stopCode = tags.local_ref ?? tags.ref ?? tags['ref:platform'];
          const address = stopCode ? `Stop code ${stopCode}` : tags.operator ?? 'Nearby stop';

          const distanceMeters = haversineMeters(
            latitude,
            longitude,
            element.lat,
            element.lon,
          );

          return {
            id: String(element.id),
            name: tags.name ?? 'Bus stop',
            address,
            distanceMeters,
            routes,
          } satisfies BusStop;
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, MAX_RESULTS);

      setStops(parsedStops);
    } catch (error) {
      console.warn('Failed to load nearby bus stops:', error);
      setErrorMessage('Unable to load nearby stops right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearbyStops();
  }, [fetchNearbyStops]);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [stops],
  );

  const renderStop: ListRenderItem<BusStop> = ({ item }) => {
    const distanceLabel = formatDistance(item.distanceMeters);
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: surface,
            borderColor: border,
            shadowOpacity: 0.04,
          },
        ]}>
        <View style={styles.cardLeft}>
          <ThemedText style={[styles.stopName, { color: text }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.stopAddress, { color: muted }]}>{item.address}</ThemedText>
          <View style={styles.routesRow}>
            <Text style={[styles.nextLabel, { color: muted }]}>Routes:</Text>
            {item.routes.length > 0 ? (
              <View style={styles.routeList}>
                {item.routes.map((route) => (
                  <View key={`${item.id}-${route}`} style={[styles.routePill, { backgroundColor: pill }]}>
                    <Text style={[styles.routeText, { color: primary }]}>{route}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.routesMissing, { color: muted }]}>Unavailable</Text>
            )}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.timeText,
              { color: success },
            ]}>
            {distanceLabel}
          </Text>
          <Text
            style={[
              styles.timeSubText,
              { color: muted },
            ]}>
            away
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: surfaceSubtle }]}>
      <ThemedView
        style={[
          styles.screen,
          {
            backgroundColor: background,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="bus" size={20} color={primary} />
            <ThemedText style={[styles.headerTitle, { color: text }]}>Nearby Bus Stops</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh nearby stops"
              onPress={fetchNearbyStops}
              disabled={loading}
              style={[
                styles.locationButton,
                { backgroundColor: surface, borderColor: border, opacity: loading ? 0.5 : 1 },
              ]}>
              <Ionicons name="location-sharp" size={18} color={primary} />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={sortedStops}
          keyExtractor={(item) => item.id}
          renderItem={renderStop}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyTitle, { color: text }]}>
                {loading ? 'Finding nearby stops...' : 'No stops available'}
              </ThemedText>
              {permissionState === 'denied' ? (
                <>
                  <ThemedText style={[styles.emptyBody, { color: muted }]}>
                    Enable location access to see the closest stops.
                  </ThemedText>
                  {Platform.OS === 'web' ? (
                    <ThemedText style={[styles.emptyBody, { color: muted }]}>
                      Check your browser site settings to allow location access.
                    </ThemedText>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => Linking.openSettings()}
                      style={[styles.emptyButton, { backgroundColor: surface, borderColor: border }]}>
                      <Text style={[styles.emptyButtonText, { color: primary }]}>Open Settings</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <ThemedText style={[styles.emptyBody, { color: muted }]}>
                  {errorMessage ?? 'Pull to refresh or try again in a moment.'}
                </ThemedText>
              )}
            </View>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLeft: {
    flex: 1,
    gap: 6,
  },
  cardRight: {
    alignItems: 'flex-end',
    paddingLeft: 12,
    minWidth: 54,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '700',
  },
  stopAddress: {
    fontSize: 13,
  },
  routesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  routeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routesMissing: {
    fontSize: 12,
    fontWeight: '500',
  },
  routePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  routeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeSubText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyButtonText: {
    fontWeight: '600',
  },
});

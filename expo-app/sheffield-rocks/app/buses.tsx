import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
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
import { dataUrl } from '@/constants/data';
import { mockBusStops } from '@/constants/mock-data';
import { useThemeColor } from '@/hooks/use-theme-color';

type BusStop = {
  id: string;
  name: string;
  code: string | null;
  area: string | null;
  distanceMeters: number;
};

type StopRow = {
  stop_id: string;
  name: string;
  code: string | null;
  area: string | null;
  lat: number;
  lon: number;
};

type PermissionState = 'unknown' | 'granted' | 'denied';

type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

const SEARCH_RADIUS_METERS = 800;
const MAX_RESULTS = 12;
const STOPS_DATABASE = 'stops.sqlite';
const STOPS_ASSET = require('@/assets/data/stops.sqlite');

const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  }
  return `${Math.round(meters / 10) * 10} m`;
};

const formatRelativeMinutes = (minutes: number) => {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
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

function BusesScreenContent() {
  const db = useSQLiteContext();
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
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('idle');
  const [feedUpdatedAt, setFeedUpdatedAt] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchFeedSummary = useCallback(async () => {
    setFeedStatus('loading');
    try {
      const response = await fetch(dataUrl('buses/sheffield-gtfsrt.json'));
      if (!response.ok) {
        throw new Error('Unable to load live bus feed.');
      }
      const data = (await response.json()) as { summary?: { generatedAt?: string } };
      setFeedUpdatedAt(data.summary?.generatedAt ?? null);
      setFeedStatus('ready');
    } catch (error) {
      console.warn('Failed to fetch live bus feed:', error);
      setFeedStatus('error');
    }
  }, []);

  const fetchNearbyStops = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setUsingMockData(false);

    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setPermissionState('denied');
        setStops(mockBusStops);
        setUsingMockData(true);
        return;
      }

      setPermissionState('granted');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const latRange = SEARCH_RADIUS_METERS / 111_320;
      const lonRange = SEARCH_RADIUS_METERS / (111_320 * Math.cos(toRadians(latitude)));

      const rows = await db.getAllAsync<StopRow>(
        `SELECT stop_id, name, code, area, lat, lon
         FROM stops
         WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?`,
        [latitude - latRange, latitude + latRange, longitude - lonRange, longitude + lonRange],
      );

      const parsedStops = rows
        .map((row) => {
          const distanceMeters = haversineMeters(latitude, longitude, row.lat, row.lon);
          return {
            id: row.stop_id,
            name: row.name,
            code: row.code ?? null,
            area: row.area ?? null,
            distanceMeters,
          } satisfies BusStop;
        })
        .filter((stop) => stop.distanceMeters <= SEARCH_RADIUS_METERS)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, MAX_RESULTS);

      if (parsedStops.length === 0) {
        setStops(mockBusStops);
        setUsingMockData(true);
      } else {
        setStops(parsedStops);
        setUsingMockData(false);
      }
    } catch (error) {
      console.warn('Failed to load nearby bus stops:', error);
      setErrorMessage('Unable to load nearby stops right now.');
      setStops(mockBusStops);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchNearbyStops();
    fetchFeedSummary();
  }, [fetchNearbyStops, fetchFeedSummary]);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [stops],
  );

  const feedLabel = useMemo(() => {
    if (feedStatus === 'loading') return 'Updating live feed...';
    if (feedStatus === 'error') return 'Live feed unavailable';
    if (!feedUpdatedAt) return 'Live feed ready';

    const minutes = Math.max(0, Math.round((Date.now() - new Date(feedUpdatedAt).getTime()) / 60000));
    return `Live feed updated ${formatRelativeMinutes(minutes)}`;
  }, [feedStatus, feedUpdatedAt]);

  const renderStop: ListRenderItem<BusStop> = ({ item }) => {
    const distanceLabel = formatDistance(item.distanceMeters);
    const subtitle = item.area ?? (item.code ? `Stop code ${item.code}` : 'Nearby stop');
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
          <ThemedText style={[styles.stopAddress, { color: muted }]}>{subtitle}</ThemedText>
          {item.code ? (
            <View style={[styles.routePill, { backgroundColor: pill }]}>
              <Text style={[styles.routeText, { color: primary }]}>{item.code}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.timeText, { color: success }]}>{distanceLabel}</Text>
          <Text style={[styles.timeSubText, { color: muted }]}>away</Text>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: surface, borderColor: border }]}>
            <Ionicons name="arrow-back" size={18} color={primary} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <Ionicons name="bus" size={20} color={primary} />
            <ThemedText style={[styles.headerTitle, { color: text }]}>Nearby Bus Stops</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh nearby stops"
            onPress={fetchNearbyStops}
            disabled={loading}
            style={[
              styles.iconButton,
              { backgroundColor: surface, borderColor: border, opacity: loading ? 0.5 : 1 },
            ]}>
            <Ionicons name="location-sharp" size={18} color={primary} />
          </Pressable>
        </View>
        <ThemedText style={[styles.feedStatus, { color: muted }]}>{feedLabel}</ThemedText>
        {usingMockData ? (
          <View style={styles.demoBanner}>
            <Ionicons name="sparkles" size={16} color={primary} />
            <ThemedText style={[styles.demoText, { color: muted }]}>
              Showing demo stops
            </ThemedText>
            {permissionState === 'denied' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={[styles.permissionButton, { backgroundColor: surface, borderColor: border }]}>
                <Text style={[styles.permissionText, { color: primary }]}>Enable location</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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

export default function BusesScreen() {
  return (
    <SQLiteProvider databaseName={STOPS_DATABASE} assetSource={{ assetId: STOPS_ASSET }}>
      <BusesScreenContent />
    </SQLiteProvider>
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
    marginBottom: 8,
    gap: 8,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedStatus: {
    marginBottom: 12,
    fontSize: 12,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permissionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
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
  routePill: {
    alignSelf: 'flex-start',
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

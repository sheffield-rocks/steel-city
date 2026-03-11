import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Platform, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatDistance, getNearbyStops, toStopSuffix, type NearbyBusStop } from '@/components/buses/stops';
import { mockBusStops } from '@/constants/mock-data';
import { useThemeColor } from '@/hooks/use-theme-color';

type PermissionState = 'unknown' | 'granted' | 'denied';

export default function NearbyStopsScreen() {
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

  const [stops, setStops] = useState<NearbyBusStop[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setUsingMockData(false);

    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      let status = currentPermission.status;

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

      const nearbyStops = await getNearbyStops(db, position.coords.latitude, position.coords.longitude);
      if (nearbyStops.length === 0) {
        setStops(mockBusStops);
        setUsingMockData(true);
      } else {
        setStops(nearbyStops);
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
    fetchNearby();
  }, [fetchNearby]);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [stops],
  );

  const renderStop: ListRenderItem<NearbyBusStop> = ({ item }) => {
    const subtitle = item.area ?? (item.code ? `Stop code ${item.code}` : 'Nearby stop');

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
        onPress={() =>
          router.push({
            pathname: '/buses/[stopId]',
            params: { stopId: item.id },
          })
        }
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <View style={styles.cardLeft}>
          <ThemedText style={[styles.stopName, { color: text }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.stopMeta, { color: muted }]}>{subtitle}</ThemedText>
          <View style={styles.rowMeta}>
            <View style={[styles.pill, { backgroundColor: pill }]}>
              <Text style={[styles.pillText, { color: primary }]}>370 {toStopSuffix(item.id)}</Text>
            </View>
            {item.code ? (
              <View style={[styles.pill, { backgroundColor: pill }]}>
                <Text style={[styles.pillText, { color: primary }]}>{item.code}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.distance, { color: success }]}>{formatDistance(item.distanceMeters)}</Text>
          <Ionicons name="arrow-forward" size={16} color={muted} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: surfaceSubtle }]}>
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
            accessibilityLabel="Back to bus stop options"
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: surface, borderColor: border }]}>
            <Ionicons name="arrow-back" size={18} color={primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <ThemedText style={[styles.title, { color: text }]}>Nearby stops</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              Ordered by distance, using on-device location and the local stop database.
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh nearby stops"
            onPress={fetchNearby}
            disabled={loading}
            style={[styles.iconButton, { backgroundColor: surface, borderColor: border, opacity: loading ? 0.5 : 1 }]}>
            <Ionicons name="locate" size={18} color={primary} />
          </Pressable>
        </View>

        {usingMockData ? (
          <View style={styles.banner}>
            <Ionicons name="sparkles" size={15} color={primary} />
            <ThemedText style={[styles.bannerText, { color: muted }]}>Showing demo stops</ThemedText>
            {permissionState === 'denied' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={[styles.bannerButton, { backgroundColor: surface, borderColor: border }]}>
                <Text style={[styles.bannerButtonText, { color: primary }]}>Enable location</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <FlatList
          data={sortedStops}
          keyExtractor={(item) => item.id}
          renderItem={renderStop}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyTitle, { color: text }]}>
                {loading ? 'Finding nearby stops...' : 'No nearby stops found'}
              </ThemedText>
              {permissionState === 'denied' ? (
                <>
                  <ThemedText style={[styles.emptyBody, { color: muted }]}>
                    Location is off, so use search or digit-code lookup instead.
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
                      <Text style={[styles.emptyButtonText, { color: primary }]}>Open settings</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <ThemedText style={[styles.emptyBody, { color: muted }]}>
                  {errorMessage ?? 'Try refreshing or use another stop-finding method.'}
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
  safeArea: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bannerButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    gap: 6,
  },
  cardRight: {
    minWidth: 70,
    alignItems: 'flex-end',
    gap: 10,
    paddingLeft: 12,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '700',
  },
  stopMeta: {
    fontSize: 13,
  },
  rowMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distance: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyButton: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: {
    fontWeight: '600',
  },
});

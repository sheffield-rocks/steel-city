import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getStopById, toStopSuffix, type BusStop } from '@/components/buses/stops';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function StopDetailScreen() {
  const db = useSQLiteContext();
  const { stopId } = useLocalSearchParams<{ stopId: string }>();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const surfaceSubtle = useThemeColor({ light: undefined, dark: undefined }, 'surfaceSubtle');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const pill = useThemeColor({ light: undefined, dark: undefined }, 'pill');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  const [stop, setStop] = useState<BusStop | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStop = async () => {
      if (!stopId) {
        return;
      }

      const nextStop = await getStopById(db, stopId);
      if (!cancelled) {
        setStop(nextStop);
      }
    };

    loadStop();

    return () => {
      cancelled = true;
    };
  }, [db, stopId]);

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
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: surface, borderColor: border }]}>
            <Ionicons name="arrow-back" size={18} color={primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <ThemedText style={[styles.title, { color: text }]}>
              {stop?.name ?? 'Stop details'}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              {stop?.area ?? 'Bus stop'}
            </ThemedText>
          </View>
        </View>

        {stop ? (
          <>
            <View style={styles.metaRow}>
              <View style={[styles.pill, { backgroundColor: pill }]}>
                <Text style={[styles.pillText, { color: primary }]}>370 {toStopSuffix(stop.id)}</Text>
              </View>
              {stop.code ? (
                <View style={[styles.pill, { backgroundColor: pill }]}>
                  <Text style={[styles.pillText, { color: primary }]}>{stop.code}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.panel, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={[styles.panelTitle, { color: text }]}>Upcoming buses</ThemedText>
              <ThemedText style={[styles.panelBody, { color: muted }]}>
                Stop selection is now wired. The live departures view is the next slice to build from the Notion flow.
              </ThemedText>
            </View>
          </>
        ) : (
          <View style={[styles.panel, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.panelTitle, { color: text }]}>Stop not found</ThemedText>
            <ThemedText style={[styles.panelBody, { color: muted }]}>
              The selected stop could not be loaded from the local database.
            </ThemedText>
          </View>
        )}
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
    paddingBottom: 16,
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
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
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
  panel: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventsDatabaseProvider } from '@/components/events-database-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type EventItem = {
  id: number;
  title: string;
  url: string;
  publishedAt: number | null;
  firstSeenAt: number;
};

type EventRow = {
  id: number;
  title: string;
  url: string;
  published_at: number | null;
  first_seen_at: number;
};

const MAX_EVENTS = 40;

const formatEventDate = (timestamp: number | null) => {
  if (!timestamp) return 'No date provided';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return formatter.format(new Date(timestamp));
};

function EventsScreenContent() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const surfaceSubtle = useThemeColor({ light: undefined, dark: undefined }, 'surfaceSubtle');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await db.getAllAsync<EventRow>(
        `SELECT id, title, url, published_at, first_seen_at
         FROM items
         ORDER BY COALESCE(published_at, first_seen_at) DESC
         LIMIT ?`,
        [MAX_EVENTS],
      );

      const parsed = rows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        publishedAt: row.published_at,
        firstSeenAt: row.first_seen_at,
      }));

      setEvents(parsed);
    } catch (error) {
      console.warn('Failed to load events list:', error);
      setErrorMessage('Unable to load event updates right now.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const renderEvent: ListRenderItem<EventItem> = ({ item }) => {
    const dateLabel = formatEventDate(item.publishedAt ?? item.firstSeenAt);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View event ${item.title}`}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/events/[id]',
            params: { id: String(item.id) },
          })
        }
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={18} color={primary} />
          <Text style={[styles.cardDate, { color: muted }]}>{dateLabel}</Text>
        </View>
        <ThemedText style={[styles.cardTitle, { color: text }]}>{item.title}</ThemedText>
        <Text style={[styles.cardHint, { color: muted }]}>Tap for details</Text>
      </Pressable>
    );
  };

  const subtitle = useMemo(() => {
    if (loading) return 'Refreshing from the public data repo...';
    if (events.length === 0) return 'Events are still loading.';
    return 'Latest community listings from the public data repo.';
  }, [loading, events.length]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: surfaceSubtle }]}
    >
      <ThemedView
        style={[
          styles.screen,
          {
            backgroundColor: background,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles" size={20} color={primary} />
            <ThemedText style={[styles.headerTitle, { color: text }]}>Events & Alerts</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh events list"
            onPress={loadEvents}
            disabled={loading}
            style={[styles.refreshButton, { backgroundColor: surface, borderColor: border, opacity: loading ? 0.5 : 1 }]}
          >
            <Ionicons name="refresh" size={18} color={primary} />
          </Pressable>
        </View>
        <ThemedText style={[styles.subtitle, { color: muted }]}>{subtitle}</ThemedText>
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyTitle, { color: text }]}> 
                {loading ? 'Loading events...' : 'No events available'}
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: muted }]}> 
                {errorMessage ?? 'Check back soon for new listings.'}
              </ThemedText>
            </View>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

export default function EventsScreen() {
  return (
    <EventsDatabaseProvider>
      <EventsScreenContent />
    </EventsDatabaseProvider>
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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardHint: {
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
});

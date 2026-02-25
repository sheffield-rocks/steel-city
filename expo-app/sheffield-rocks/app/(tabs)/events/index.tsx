import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventsDatabaseProvider } from '@/components/events-database-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockEvents } from '@/constants/mock-data';
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

type EventFilter = {
  id: string;
  label: string;
  keywords: string[] | null;
};

const MAX_EVENTS = 40;

const EVENT_FILTERS: EventFilter[] = [
  { id: 'all', label: 'All Nights', keywords: null },
  { id: 'live', label: 'Live Music', keywords: ['gig', 'live', 'band', 'music', 'concert', 'orchestra'] },
  { id: 'club', label: 'Clubs', keywords: ['club', 'dj', 'dance', 'party', 'rave', 'disco', 'house', 'techno'] },
  { id: 'comedy', label: 'Comedy', keywords: ['comedy', 'stand-up', 'standup', 'improv'] },
  { id: 'theatre', label: 'Theatre', keywords: ['theatre', 'theater', 'play', 'drama', 'show'] },
  { id: 'food', label: 'Food & Drink', keywords: ['bar', 'pub', 'beer', 'brew', 'wine', 'cocktail', 'tasting', 'food'] },
];

const formatEventDate = (timestamp: number | null) => {
  if (!timestamp) return 'No date provided';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return formatter.format(new Date(timestamp));
};

const normalizeText = (value: string) => value.trim().toLowerCase();

function EventsScreenContent() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const surfaceSubtle = useThemeColor({ light: undefined, dark: undefined }, 'surfaceSubtle');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const pill = useThemeColor({ light: undefined, dark: undefined }, 'pill');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<EventFilter['id']>('all');
  const [usingMockData, setUsingMockData] = useState(false);

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

      if (parsed.length === 0) {
        setEvents(mockEvents);
        setUsingMockData(true);
      } else {
        setEvents(parsed);
        setUsingMockData(false);
      }
    } catch (error) {
      console.warn('Failed to load events list:', error);
      setErrorMessage('Unable to load event updates right now.');
      setEvents(mockEvents);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = normalizeText(searchQuery);
    const filter = EVENT_FILTERS.find((item) => item.id === activeFilterId) ?? EVENT_FILTERS[0];

    return events.filter((event) => {
      const title = event.title.toLowerCase();
      if (query && !title.includes(query)) {
        return false;
      }
      if (filter.keywords) {
        return filter.keywords.some((keyword) => title.includes(keyword));
      }
      return true;
    });
  }, [events, searchQuery, activeFilterId]);

  const subtitle = useMemo(() => {
    if (loading) return 'Refreshing Sheffield after-dark listings...';
    if (events.length === 0) return 'The night feed is still warming up.';
    return 'Gigs, club nights, late openings, and pop-up energy across the city.';
  }, [loading, events.length]);

  const resultLabel = useMemo(() => {
    if (events.length === 0) return 'No listings yet';
    if (filteredEvents.length === events.length) return `${events.length} listings in the hub`;
    return `${filteredEvents.length} of ${events.length} listings`;
  }, [events.length, filteredEvents.length]);

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

  const emptyTitle = loading
    ? 'Loading events...'
    : events.length === 0
      ? 'No events available'
      : 'No matches found';
  const emptyBody = loading
    ? 'Hang tight while we sync the latest listings.'
    : events.length === 0
      ? errorMessage ?? 'Check back soon for new listings.'
      : 'Try a different search or toggle a new filter.';

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
            <ThemedText style={[styles.headerTitle, { color: text }]}>EventsHub</ThemedText>
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
        {usingMockData ? (
          <View style={styles.demoRow}>
            <Ionicons name="sparkles" size={16} color={primary} />
            <ThemedText style={[styles.demoText, { color: muted }]}>Demo listings loaded</ThemedText>
          </View>
        ) : null}

        <View style={[styles.searchBar, { backgroundColor: surface, borderColor: border }]}> 
          <Ionicons name="search" size={18} color={muted} />
          <TextInput
            placeholder="Search gigs, club nights, comedy..."
            placeholderTextColor={muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: text }]}
            returnKeyType="search"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {EVENT_FILTERS.map((filter) => {
            const isActive = filter.id === activeFilterId;
            return (
              <Pressable
                key={filter.id}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${filter.label}`}
                onPress={() => setActiveFilterId(filter.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? pill : surface,
                    borderColor: isActive ? primary : border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: isActive ? primary : muted }]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsRow}>
          <ThemedText style={[styles.resultsText, { color: muted }]}>{resultLabel}</ThemedText>
        </View>

        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyTitle, { color: text }]}> {emptyTitle}</ThemedText>
              <ThemedText style={[styles.emptyBody, { color: muted }]}> {emptyBody}</ThemedText>
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
    marginBottom: 16,
    fontSize: 13,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    paddingVertical: 14,
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsRow: {
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDate: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
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

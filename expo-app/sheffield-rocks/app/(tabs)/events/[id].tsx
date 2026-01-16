import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventsDatabaseProvider } from '@/components/events-database-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type EventRow = {
  id: number;
  title: string;
  url: string;
  published_at: number | null;
  first_seen_at: number;
};

type EventItem = {
  id: number;
  title: string;
  url: string;
  publishedAt: number | null;
  firstSeenAt: number;
};

const formatEventDate = (timestamp: number | null) => {
  if (!timestamp) return 'No date provided';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  return formatter.format(new Date(timestamp));
};

function EventDetailContent() {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const row = await db.getFirstAsync<EventRow>(
        `SELECT id, title, url, published_at, first_seen_at FROM items WHERE id = ?`,
        [Number(eventId)],
      );
      if (!row) {
        setEvent(null);
        return;
      }
      setEvent({
        id: row.id,
        title: row.title,
        url: row.url,
        publishedAt: row.published_at,
        firstSeenAt: row.first_seen_at,
      });
    } catch (error) {
      console.warn('Failed to load event detail:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [db, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <ThemedView
        style={[
          styles.screen,
          {
            backgroundColor: background,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: surface, borderColor: border }]}
        >
          <Ionicons name="arrow-back" size={18} color={primary} />
          <Text style={[styles.backText, { color: primary }]}>Back</Text>
        </Pressable>

        {loading ? (
          <ThemedText style={[styles.loadingText, { color: muted }]}>Loading event...</ThemedText>
        ) : event ? (
          <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}> 
            <ThemedText style={[styles.title, { color: text }]}>{event.title}</ThemedText>
            <ThemedText style={[styles.date, { color: muted }]}> 
              {formatEventDate(event.publishedAt ?? event.firstSeenAt)}
            </ThemedText>
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(event.url)}
              style={styles.linkButton}
            >
              <Ionicons name="open-outline" size={16} color={primary} />
              <Text style={[styles.linkText, { color: primary }]}>Open source link</Text>
            </Pressable>
          </View>
        ) : (
          <ThemedText style={[styles.loadingText, { color: muted }]}>Event not found.</ThemedText>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

export default function EventDetailScreen() {
  return (
    <EventsDatabaseProvider>
      <EventDetailContent />
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
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
  },
});

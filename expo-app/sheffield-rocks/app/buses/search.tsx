import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchStops, toStopSuffix, type BusStop } from '@/components/buses/stops';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SearchStopsScreen() {
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

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      if (!deferredQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const nextResults = await searchStops(db, deferredQuery);
      if (cancelled) {
        return;
      }

      startTransition(() => {
        setResults(nextResults);
        setLoading(false);
      });
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [db, deferredQuery]);

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
            <ThemedText style={[styles.title, { color: text }]}>Search for a stop</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              Instant search against the local stop database.
            </ThemedText>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: surface, borderColor: border }]}>
          <Ionicons name="search" size={18} color={muted} />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="Search for a stop name or route number"
            placeholderTextColor={muted}
            style={[styles.searchInput, { color: text }]}
            value={query}
          />
        </View>

        {loading ? (
          <ThemedText style={[styles.statusText, { color: muted }]}>Searching…</ThemedText>
        ) : query.trim() ? (
          <ThemedText style={[styles.statusText, { color: muted }]}>
            {results.length === 0 ? 'No matches yet' : `${results.length} matching stops`}
          </ThemedText>
        ) : (
          <ThemedText style={[styles.statusText, { color: muted }]}>
            Start typing to search by stop name, area, code, or the last five digits.
          </ThemedText>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}`}
              onPress={() =>
                router.push({
                  pathname: '/buses/[stopId]',
                  params: { stopId: item.id },
                })
              }
              style={[styles.resultCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.resultBody}>
                <Text style={[styles.resultTitle, { color: text }]}>{item.name}</Text>
                <Text style={[styles.resultSubtitle, { color: muted }]}>
                  {item.area ?? 'Bus stop'}
                </Text>
                <View style={styles.resultMeta}>
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
              <Ionicons name="arrow-forward" size={16} color={muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.emptyState}>
                <ThemedText style={[styles.emptyTitle, { color: text }]}>No stops found</ThemedText>
                <ThemedText style={[styles.emptyBody, { color: muted }]}>
                  Check the spelling, try the stop area, or use the digit-code option instead.
                </ThemedText>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
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
  searchBar: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  statusText: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  resultCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultBody: {
    flex: 1,
    gap: 6,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultMeta: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 10,
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
});

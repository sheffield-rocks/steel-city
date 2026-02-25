import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockBusStops, mockEvents } from '@/constants/mock-data';
import { useThemeColor } from '@/hooks/use-theme-color';

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
  const demoStopsCount = mockBusStops.length;
  const demoEventsCount = mockEvents.length;

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
          <ThemedText style={[styles.title, { color: text }]}>Sheffield Tonight</ThemedText>
          <ThemedText style={[styles.subtitle, { color: muted }]}>Pick a lane and we will handle the rest.</ThemedText>
          <View style={styles.demoRow}>
            <View style={[styles.demoPill, { backgroundColor: pill }]}> 
              <Text style={[styles.demoText, { color: primary }]}>{demoStopsCount} demo stops</Text>
            </View>
            <View style={[styles.demoPill, { backgroundColor: pill }]}> 
              <Text style={[styles.demoText, { color: success }]}>{demoEventsCount} demo events</Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Find nearby bus stops"
            onPress={() => router.push('/buses')}
            style={[styles.actionCard, { backgroundColor: surface, borderColor: border }]}
          >
            <View style={styles.actionHeader}>
              <View style={[styles.iconBadge, { backgroundColor: pill }]}> 
                <Ionicons name="bus" size={22} color={primary} />
              </View>
              <Ionicons name="arrow-forward" size={18} color={muted} />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, { color: text }]}>Buses</Text>
              <Text style={[styles.actionSubtitle, { color: muted }]}>Live arrivals and the closest stops around you.</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open EventsHub"
            onPress={() => router.push('/events')}
            style={[styles.actionCard, { backgroundColor: surface, borderColor: border }]}
          >
            <View style={styles.actionHeader}>
              <View style={[styles.iconBadge, { backgroundColor: pill }]}> 
                <Ionicons name="sparkles" size={22} color={success} />
              </View>
              <Ionicons name="arrow-forward" size={18} color={muted} />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, { color: text }]}>Events</Text>
              <Text style={[styles.actionSubtitle, { color: muted }]}>Search, filter, and discover Sheffield after dark.</Text>
            </View>
          </Pressable>
        </View>
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
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  demoPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: 16,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    gap: 6,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 13,
  },
});

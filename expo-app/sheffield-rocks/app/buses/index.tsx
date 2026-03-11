import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress?: () => void;
  disabled?: boolean;
};

function OptionCard({ icon, title, body, onPress, disabled }: OptionCardProps) {
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const pill = useThemeColor({ light: undefined, dark: undefined }, 'pill');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          backgroundColor: surface,
          borderColor: border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}>
      <View style={styles.optionHeader}>
        <View style={[styles.iconBadge, { backgroundColor: pill }]}>
          <Ionicons name={icon} size={20} color={primary} />
        </View>
        <Ionicons name="arrow-forward" size={18} color={muted} />
      </View>
      <View style={styles.optionBody}>
        <Text style={[styles.optionTitle, { color: text }]}>{title}</Text>
        <Text style={[styles.optionCopy, { color: muted }]}>{body}</Text>
      </View>
    </Pressable>
  );
}

export default function BusesHubScreen() {
  const insets = useSafeAreaInsets();
  const background = useThemeColor({ light: undefined, dark: undefined }, 'background');
  const surfaceSubtle = useThemeColor({ light: undefined, dark: undefined }, 'surfaceSubtle');
  const text = useThemeColor({ light: undefined, dark: undefined }, 'text');
  const muted = useThemeColor({ light: undefined, dark: undefined }, 'muted');
  const primary = useThemeColor({ light: undefined, dark: undefined }, 'primary');
  const border = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const surface = useThemeColor({ light: undefined, dark: undefined }, 'surface');

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
            accessibilityLabel="Back to home"
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: surface, borderColor: border }]}>
            <Ionicons name="arrow-back" size={18} color={primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <ThemedText style={[styles.title, { color: text }]}>Find a bus stop</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              Choose the fastest way to get to live departures.
            </ThemedText>
          </View>
        </View>

        <View style={styles.options}>
          <OptionCard
            icon="locate"
            title="Nearby stops"
            body="Use your location and jump into the nearest stops around you."
            onPress={() => router.push('/buses/nearby')}
          />
          <OptionCard
            icon="search"
            title="Search by free text"
            body="Find a stop by name, area, short code, or the last five digits."
            onPress={() => router.push('/buses/search')}
          />
          <OptionCard
            icon="keypad"
            title="Lookup by digit code"
            body="Enter the five digits after the standard 370 prefix."
            onPress={() => router.push('/buses/code')}
          />
          <OptionCard
            icon="qr-code"
            title="Scan using a QR code"
            body="Deferred for a later round once the core stop flows are solid."
            disabled
          />
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
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  options: {
    gap: 14,
  },
  optionCard: {
    minHeight: 126,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    gap: 6,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
});

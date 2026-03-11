import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getStopByDigits } from '@/components/buses/stops';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', 'Go'],
];

export default function DigitCodeScreen() {
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
  const danger = '#b3261e';

  const [digits, setDigits] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (digits.length !== 5) {
      return;
    }

    const stop = await getStopByDigits(db, digits);
    if (!stop) {
      setErrorMessage('That code does not match a known stop. Check the sign and try again.');
      return;
    }

    setErrorMessage(null);
    router.push({
      pathname: '/buses/[stopId]',
      params: { stopId: stop.id },
    });
  };

  const handleKeyPress = (value: string) => {
    if (value === '⌫') {
      setDigits((current) => current.slice(0, -1));
      setErrorMessage(null);
      return;
    }

    if (value === 'Go') {
      void handleSubmit();
      return;
    }

    setDigits((current) => (current.length < 5 ? `${current}${value}` : current));
    setErrorMessage(null);
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
            <ThemedText style={[styles.title, { color: text }]}>Lookup by digit code</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              Enter the five digits after the standard 370 prefix.
            </ThemedText>
          </View>
        </View>

        <View style={styles.displayWrap}>
          <View style={[styles.prefixPill, { backgroundColor: pill }]}>
            <Text style={[styles.prefixText, { color: primary }]}>370</Text>
          </View>
          <View style={styles.slots}>
            {Array.from({ length: 5 }).map((_, index) => {
              const char = digits[index] ?? '';
              return (
                <View key={index} style={[styles.slot, { backgroundColor: surface, borderColor: border }]}>
                  <Text style={[styles.slotText, { color: text }]}>{char}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <ThemedText style={[styles.helperText, { color: muted }]}>
          Full stop code: 37000{digits.padEnd(5, '•')}
        </ThemedText>
        {errorMessage ? (
          <ThemedText style={[styles.errorText, { color: danger }]}>{errorMessage}</ThemedText>
        ) : null}

        <View style={styles.keypad}>
          {KEYS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => {
                const isSubmit = key === 'Go';
                const disabled = isSubmit && digits.length !== 5;

                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={key === '⌫' ? 'Delete digit' : key}
                    disabled={disabled}
                    onPress={() => handleKeyPress(key)}
                    style={[
                      styles.key,
                      {
                        backgroundColor: isSubmit ? primary : surface,
                        borderColor: isSubmit ? primary : border,
                        opacity: disabled ? 0.4 : 1,
                      },
                    ]}>
                    <Text style={[styles.keyText, { color: isSubmit ? '#fff' : text }]}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
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
  displayWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  prefixPill: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  prefixText: {
    fontSize: 24,
    fontWeight: '700',
  },
  slots: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotText: {
    fontSize: 24,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  keypad: {
    gap: 12,
    marginTop: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
});

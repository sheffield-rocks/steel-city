import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mockEvents } from '@/constants/mock-data';

export default function ModalScreen() {
  const highlights = mockEvents.slice(0, 2);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <ThemedText style={styles.subtitle}>Demo highlights</ThemedText>
      {highlights.map((event) => (
        <ThemedText key={event.id} style={styles.highlightItem}>
          {event.title}
        </ThemedText>
      ))}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  highlightItem: {
    marginTop: 8,
    textAlign: 'center',
  },
});

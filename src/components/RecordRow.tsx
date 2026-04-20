import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTimeOfDay } from '../utils/formatters';
import { COLORS } from '../utils/theme';
import { PomodoroRecord } from '../store/pomodoroStore';

export function RecordRow({ item }: { item: PomodoroRecord }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.time}>
          {formatTimeOfDay(item.startedAt)}
          <Text style={styles.separator}> → </Text>
          {formatTimeOfDay(item.finishedAt)}
        </Text>
        <Text style={styles.duration}>{item.durationMinutes} min de foco</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🍅</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.focusAccent,
    opacity: 0.7,
  },
  content: { flex: 1 },
  time: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  separator: { color: 'rgba(255,255,255,0.25)', fontWeight: '300' },
  duration: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 16 },
});

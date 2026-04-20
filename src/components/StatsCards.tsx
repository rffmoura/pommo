import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatFocusTime } from '../utils/formatters';
import { COLORS } from '../utils/theme';

interface Props {
  totalMinutes: number;
  avgMinutes: number;
  bestLabel: string;
  bestMinutes: number;
}

export function StatsCards({ totalMinutes, avgMinutes, bestLabel, bestMinutes }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.value}>{formatFocusTime(totalMinutes)}</Text>
          <Text style={styles.label}>Total de foco</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>{avgMinutes > 0 ? formatFocusTime(avgMinutes) : '—'}</Text>
          <Text style={styles.label}>Média por dia ativo</Text>
        </View>
      </View>
      {bestMinutes > 0 && (
        <View style={styles.bestCard}>
          <Text style={styles.bestTitle}>Dia mais produtivo</Text>
          <View style={styles.bestRow}>
            <Text style={styles.bestLabel}>{bestLabel}</Text>
            <Text style={styles.bestTime}>{formatFocusTime(bestMinutes)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 4,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  bestCard: {
    backgroundColor: COLORS.focusAccent + '18',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.focusAccent + '35',
    padding: 16,
    gap: 6,
  },
  bestTitle: {
    color: COLORS.focusAccent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bestTime: {
    color: COLORS.focusAccent,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

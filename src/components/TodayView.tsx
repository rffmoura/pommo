import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { PomodoroRecord } from '../store/pomodoroStore';
import { formatFocusTime } from '../utils/formatters';
import { RecordRow } from './RecordRow';
import { COLORS } from '../utils/theme';

interface Props {
  records: PomodoroRecord[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function TodayView({ records, refreshing, onRefresh }: Props) {
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="rgba(255,255,255,0.4)" />
  );

  if (records.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.empty} refreshControl={refreshControl}>
        <Text style={styles.emptyIcon}>🍅</Text>
        <Text style={styles.emptyTitle}>Nenhum pomodoro hoje</Text>
        <Text style={styles.emptySubtitle}>Conclua um pomodoro para{'\n'}começar a registrar seu histórico</Text>
      </ScrollView>
    );
  }

  const totalMinutes = records.reduce((s, r) => s + r.durationMinutes, 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.label}>Hoje</Text>
          <View style={styles.headerRight}>
            <View style={styles.timeChip}>
              <Text style={styles.timeText}>{formatFocusTime(totalMinutes)}</Text>
            </View>
            <View style={styles.countChip}>
              <Text style={styles.countText}>
                {records.length} {records.length === 1 ? 'pomodoro' : 'pomodoros'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.records}>
          {records.map(r => <RecordRow key={r.id} item={r} />)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  timeChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  countChip: {
    backgroundColor: COLORS.focusAccent + '25',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.focusAccent + '40',
  },
  countText: { color: COLORS.focusAccent, fontSize: 12, fontWeight: '600' },
  records: { paddingVertical: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: -60,
  },
  emptyIcon: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DayGroup } from '../types/types';
import { formatDayLabel, formatFocusTime } from '../utils/formatters';
import { RecordRow } from './RecordRow';
import { COLORS } from '../utils/theme';

interface Props {
  groups: DayGroup[];
  collapsedDays: Set<string>;
  toggleDay: (key: string) => void;
}

export function DayList({ groups, collapsedDays, toggleDay }: Props) {
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.container}>
      {groups.map(item => {
        const totalMinutes = item.records.reduce((s, r) => s + r.durationMinutes, 0);
        const isCollapsed = collapsedDays.has(item.dayKey);
        const isToday = item.dayKey === todayKey;

        return (
          <View key={item.dayKey} style={styles.group}>
            <TouchableOpacity
              style={styles.header}
              onPress={() => toggleDay(item.dayKey)}
              activeOpacity={isToday ? 1 : 0.7}
            >
              <Text style={styles.label}>{formatDayLabel(item.dayKey)}</Text>
              <View style={styles.headerRight}>
                <View style={styles.timeChip}>
                  <Text style={styles.timeText}>{formatFocusTime(totalMinutes)}</Text>
                </View>
                <View style={styles.countChip}>
                  <Text style={styles.countText}>
                    {item.records.length} {item.records.length === 1 ? 'pomodoro' : 'pomodoros'}
                  </Text>
                </View>
                {!isToday && (
                  <Text style={styles.chevron}>{isCollapsed ? '›' : '⌄'}</Text>
                )}
              </View>
            </TouchableOpacity>
            {!isCollapsed && (
              <View style={styles.records}>
                {item.records.map(r => <RecordRow key={r.id} item={r} />)}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  group: {
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
  chevron: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 18,
    lineHeight: 20,
    marginLeft: 2,
  },
  records: { paddingVertical: 4 },
});

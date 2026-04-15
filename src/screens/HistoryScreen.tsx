import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getRecords, groupRecordsByDay, clearRecords, PomodoroRecord } from '../store/pomodoroStore';
import { COLORS } from '../utils/theme';

function formatTimeOfDay(isoString: string): string {
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatFocusTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Hoje';
  if (isYesterday) return 'Ontem';

  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${weekdays[date.getDay()]}, ${day} ${months[month - 1]}`;
}

interface DayGroup {
  dayKey: string;
  records: PomodoroRecord[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async () => {
    const records = await getRecords();
    const grouped = groupRecordsByDay(records.filter((r) => r.type === 'focus'));
    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayKey, recs]) => ({ dayKey, records: recs }));
    setGroups(sorted);

    const todayKey = new Date().toISOString().slice(0, 10);
    setTotalToday(grouped[todayKey]?.length ?? 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }, [loadRecords]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Limpar histórico',
      'Tem certeza que deseja apagar todos os registros?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await clearRecords();
            setGroups([]);
            setTotalToday(0);
          },
        },
      ]
    );
  }, []);

  const renderRecord = useCallback(({ item, index }: { item: PomodoroRecord; index: number }) => (
    <View style={styles.recordRow}>
      <View style={styles.recordDot} />
      <View style={styles.recordContent}>
        <Text style={styles.recordTime}>{formatTimeOfDay(item.finishedAt)}</Text>
        <Text style={styles.recordDuration}>{item.durationMinutes} min de foco</Text>
      </View>
      <View style={styles.recordBadge}>
        <Text style={styles.recordBadgeText}>🍅</Text>
      </View>
    </View>
  ), []);

  const renderDay = useCallback(({ item }: { item: DayGroup }) => {
    const totalMinutes = item.records.reduce((sum, r) => sum + r.durationMinutes, 0);
    return (
    <View style={styles.dayGroup}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayLabel}>{formatDayLabel(item.dayKey)}</Text>
        <View style={styles.dayHeaderRight}>
          <View style={styles.dayTime}>
            <Text style={styles.dayTimeText}>{formatFocusTime(totalMinutes)}</Text>
          </View>
          <View style={styles.dayCount}>
            <Text style={styles.dayCountText}>{item.records.length} {item.records.length === 1 ? 'pomodoro' : 'pomodoros'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.dayRecords}>
        {item.records.map((record, index) => renderRecord({ item: record, index }))}
      </View>
    </View>
  );
  }, [renderRecord]);

  return (
    <LinearGradient colors={[COLORS.bgFrom, COLORS.bgTo]} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>
              {totalToday > 0
                ? `${totalToday} pomodoro${totalToday > 1 ? 's' : ''} hoje`
                : 'Nenhum pomodoro hoje ainda'}
            </Text>
          </View>
          {groups.length > 0 && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍅</Text>
            <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
            <Text style={styles.emptySubtitle}>Conclua um pomodoro para{'\n'}começar a registrar seu histórico</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.dayKey}
            renderItem={renderDay}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="rgba(255,255,255,0.4)" />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    marginTop: 4,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
  },
  clearBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    gap: 20,
  },
  dayGroup: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTime: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dayTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  dayLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dayCount: {
    backgroundColor: COLORS.focusAccent + '25',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.focusAccent + '40',
  },
  dayCountText: {
    color: COLORS.focusAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  dayRecords: {
    paddingVertical: 4,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.focusAccent,
    opacity: 0.7,
  },
  recordContent: {
    flex: 1,
  },
  recordTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  recordDuration: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 1,
  },
  recordBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBadgeText: {
    fontSize: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: -60,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

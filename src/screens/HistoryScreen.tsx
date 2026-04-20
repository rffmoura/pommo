import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getRecords, groupRecordsByDay, clearRecords, PomodoroRecord } from '../store/pomodoroStore';
import { COLORS } from '../utils/theme';
import { DayGroup } from '../types/types';
import { PeriodChart } from '../components/PeriodChart';
import { getCurrentWeekDays, getCurrentMonthDays } from '../utils/chartUtils';
import { TodayView } from '../components/TodayView';
import { DayList } from '../components/DayList';

type TabType = 'dia' | 'semana' | 'mes';

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface HistoryScreenProps {
  refreshTrigger?: number;
}

export default function HistoryScreen({ refreshTrigger }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [grouped, setGrouped] = useState<Record<string, PomodoroRecord[]>>({});
  const [todayRecords, setTodayRecords] = useState<PomodoroRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('dia');
  const todayKey = useRef(new Date().toISOString().slice(0, 10));

  const loadRecords = useCallback(async () => {
    const records = await getRecords();
    const g = groupRecordsByDay(records.filter(r => r.type === 'focus'));
    const sorted = Object.entries(g)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayKey, recs]) => ({ dayKey, records: recs }));
    setGroups(sorted);
    setGrouped(g);
    setTodayRecords(g[todayKey.current] ?? []);
    const pastDays = new Set(sorted.map((g) => g.dayKey).filter((k) => k !== todayKey.current));
    setCollapsedDays(pastDays);
  }, []);

  useFocusEffect(useCallback(() => { loadRecords(); }, [loadRecords]));

  useEffect(() => {
    if (refreshTrigger) loadRecords();
  }, [refreshTrigger, loadRecords]);

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
            setGrouped({});
            setTodayRecords([]);
          },
        },
      ]
    );
  }, []);

  const toggleDay = useCallback((dayKey: string) => {
    if (dayKey === todayKey.current) return;
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(dayKey) ? next.delete(dayKey) : next.add(dayKey);
      return next;
    });
  }, []);

  const weekDates = getCurrentWeekDays();
  const allMonthDates = getCurrentMonthDays();
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const weekKeys = new Set(weekDates.map(d => d.toISOString().slice(0, 10)));
  const weekGroups = groups.filter(g => weekKeys.has(g.dayKey));
  const monthGroups = groups.filter(g => g.dayKey.startsWith(currentMonthPrefix));

  // Only show bars for days that have data
  const activeMonthDates = allMonthDates.filter(d => {
    const key = d.toISOString().slice(0, 10);
    return (grouped[key]?.length ?? 0) > 0;
  });

  const n = todayRecords.length;
  const subtitle = activeTab === 'dia'
    ? (n > 0 ? `${n} pomodoro${n > 1 ? 's' : ''} hoje` : 'Nenhum pomodoro hoje ainda')
    : activeTab === 'semana' ? 'Esta semana'
    : 'Este mês';

  return (
    <LinearGradient colors={[COLORS.bgFrom, COLORS.bgTo]} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }]}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {groups.length > 0 && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabBar}>
          {(['dia', 'semana', 'mes'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'dia' ? 'Dia' : tab === 'semana' ? 'Semana' : 'Mês'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'dia' && (
          <TodayView records={todayRecords} refreshing={refreshing} onRefresh={handleRefresh} />
        )}

        {activeTab === 'semana' && (
          <PeriodChart
            grouped={grouped}
            dates={weekDates}
            labelFn={(_, i) => WEEK_LABELS[i]}
            emptyText="Nenhum foco essa semana"
          >
            {weekGroups.length > 0 && (
              <DayList groups={weekGroups} collapsedDays={collapsedDays} toggleDay={toggleDay} />
            )}
          </PeriodChart>
        )}

        {activeTab === 'mes' && (
          <PeriodChart
            grouped={grouped}
            dates={activeMonthDates}
            labelFn={(d) => String(d.getDate())}
            emptyText="Nenhum foco esse mês"
          >
            {monthGroups.length > 0 && (
              <DayList groups={monthGroups} collapsedDays={collapsedDays} toggleDay={toggleDay} />
            )}
          </PeriodChart>
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
    marginBottom: 20,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4 },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
  },
  clearBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { PomodoroRecord } from '../store/pomodoroStore';
import { COLORS } from '../utils/theme';
import { StatsCards } from './StatsCards';
import { buildChartData, computePeriodStats, periodMaxValue } from '../utils/chartUtils';

const CHART_WIDTH = Dimensions.get('window').width - 48;

interface Props {
  grouped: Record<string, PomodoroRecord[]>;
  dates: Date[];
  labelFn: (d: Date, i: number) => string;
  labelEvery?: number;
  scrollable?: boolean;
  emptyText: string;
  children?: React.ReactNode;
}

export function PeriodChart({
  grouped,
  dates,
  labelFn,
  labelEvery = 1,
  scrollable = false,
  emptyText,
  children,
}: Props) {
  const rawData = buildChartData(grouped, dates, labelFn, labelEvery);
  const stats = computePeriodStats(grouped, dates);
  const maxVal = periodMaxValue(grouped, dates);

  const barWidth = scrollable
    ? 14
    : Math.floor((CHART_WIDTH - 40 - (dates.length - 1) * 6) / dates.length);

  const barData = rawData.map(p => ({
    value: p.value,
    label: p.label,
    frontColor: p.isBest ? '#ffffff' : COLORS.focusAccent,
    gradientColor: p.isBest ? 'rgba(255,255,255,0.3)' : COLORS.focusAccent + '50',
    topLabelComponent: p.isBest ? () => <View style={styles.topDot} /> : undefined,
  }));

  const chart = (
    <BarChart
      data={barData}
      barWidth={barWidth}
      spacing={scrollable ? 5 : 6}
      roundedTop
      xAxisThickness={1}
      xAxisColor="rgba(255,255,255,0.08)"
      yAxisThickness={0}
      yAxisTextStyle={styles.axisText}
      xAxisLabelTextStyle={styles.axisText}
      noOfSections={3}
      maxValue={maxVal}
      rulesColor="rgba(255,255,255,0.06)"
      rulesType="solid"
      backgroundColor="transparent"
      isAnimated
      animationDuration={500}
      width={scrollable ? undefined : CHART_WIDTH - 40}
    />
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.chartCard}>
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chart}
          </ScrollView>
        ) : chart}
      </View>

      {stats.totalMinutes === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍅</Text>
          <Text style={styles.emptyTitle}>{emptyText}</Text>
        </View>
      ) : (
        <StatsCards {...stats} />
      )}

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 20, gap: 16 },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    paddingBottom: 8,
  },
  axisText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  topDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginBottom: 2,
    alignSelf: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
});

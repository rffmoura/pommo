import { PomodoroRecord } from '../store/pomodoroStore';
import { formatDayLabel } from './formatters';

export function getCurrentWeekDays(): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getCurrentMonthDays(): Date[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

export interface PeriodDataPoint {
  value: number;
  label: string;
  isBest: boolean;
}

export function buildChartData(
  grouped: Record<string, PomodoroRecord[]>,
  dates: Date[],
  labelFn: (d: Date, i: number) => string,
  labelEvery = 1,
): PeriodDataPoint[] {
  const items = dates.map((d, i) => {
    const key = d.toISOString().slice(0, 10);
    const minutes = (grouped[key] ?? []).reduce((s, r) => s + r.durationMinutes, 0);
    const showLabel = i % labelEvery === 0 || i === dates.length - 1;
    return { value: minutes, label: showLabel ? labelFn(d, i) : '' };
  });
  const maxVal = Math.max(...items.map(i => i.value), 1);
  return items.map(item => ({ ...item, isBest: item.value > 0 && item.value === maxVal }));
}

export function computePeriodStats(grouped: Record<string, PomodoroRecord[]>, dates: Date[]) {
  if (dates.length === 0) {
    return { totalMinutes: 0, avgMinutes: 0, bestLabel: '—', bestMinutes: 0, activeDays: 0 };
  }
  const entries = dates.map(d => {
    const key = d.toISOString().slice(0, 10);
    const minutes = (grouped[key] ?? []).reduce((s, r) => s + r.durationMinutes, 0);
    return { key, minutes };
  });
  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
  const activeDays = entries.filter(e => e.minutes > 0).length;
  const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const best = entries.reduce((a, b) => b.minutes > a.minutes ? b : a, entries[0]);
  return {
    totalMinutes,
    avgMinutes,
    bestLabel: best.minutes > 0 ? formatDayLabel(best.key) : '—',
    bestMinutes: best.minutes,
    activeDays,
  };
}

export function periodMaxValue(grouped: Record<string, PomodoroRecord[]>, dates: Date[]): number {
  const max = Math.max(...dates.map(d => {
    const key = d.toISOString().slice(0, 10);
    return (grouped[key] ?? []).reduce((s, r) => s + r.durationMinutes, 0);
  }), 30);
  return Math.ceil(max / 30) * 30;
}

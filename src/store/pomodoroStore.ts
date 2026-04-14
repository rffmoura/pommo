import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PomodoroRecord {
  id: string;
  startedAt: string; // ISO string
  finishedAt: string; // ISO string
  type: 'focus' | 'rest';
  durationMinutes: number;
}

export interface PomodoroSettings {
  focusMinutes: number;
  restMinutes: number;
}

const RECORDS_KEY = '@pommo:records';
const SETTINGS_KEY = '@pommo:settings';

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  restMinutes: 5,
};

export async function saveRecord(record: PomodoroRecord): Promise<void> {
  const existing = await getRecords();
  const updated = [record, ...existing];
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
}

export async function getRecords(): Promise<PomodoroRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PomodoroRecord[];
  } catch {
    return [];
  }
}

export async function clearRecords(): Promise<void> {
  await AsyncStorage.removeItem(RECORDS_KEY);
}

export async function getSettings(): Promise<PomodoroSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: PomodoroSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function groupRecordsByDay(records: PomodoroRecord[]): Record<string, PomodoroRecord[]> {
  const groups: Record<string, PomodoroRecord[]> = {};
  for (const record of records) {
    const date = new Date(record.finishedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  }
  return groups;
}

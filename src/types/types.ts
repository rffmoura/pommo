import { PomodoroRecord } from '../store/pomodoroStore';

export interface DayGroup {
  dayKey: string;
  records: PomodoroRecord[];
}

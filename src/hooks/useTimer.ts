import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { AppState, AppStateStatus } from 'react-native';
import { saveRecord } from '../store/pomodoroStore';
import { playCompletionSound } from '../utils/audio';
import {
  scheduleTimerNotification,
  cancelAllNotifications,
} from '../utils/notifications';

export type TimerPhase = 'focus' | 'rest' | 'idle';
export type TimerStatus = 'running' | 'paused' | 'idle';

interface UseTimerOptions {
  focusMinutes: number;
  restMinutes: number;
  onPhaseComplete?: (phase: TimerPhase) => void;
}

interface UseTimerReturn {
  phase: TimerPhase;
  status: TimerStatus;
  secondsLeft: number;
  totalSeconds: number;
  progress: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skipToRest: () => void;
  finishRest: () => void;
}

export function useTimer({
  focusMinutes,
  restMinutes,
  onPhaseComplete,
}: UseTimerOptions): UseTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedSecondsLeftRef = useRef<number>(focusMinutes * 60);
  const phaseRef = useRef<TimerPhase>('idle');
  const statusRef = useRef<TimerStatus>('idle');
  const focusStartedAtRef = useRef<string>('');
  const notifIdRef = useRef<string | undefined>(undefined);
  const appStateRef = useRef<AppStateStatus>('active');

  // Keep refs so callbacks don't go stale
  const focusMinutesRef = useRef(focusMinutes);
  const restMinutesRef = useRef(restMinutes);
  const onPhaseCompleteRef = useRef(onPhaseComplete);
  focusMinutesRef.current = focusMinutes;
  restMinutesRef.current = restMinutes;
  onPhaseCompleteRef.current = onPhaseComplete;

  phaseRef.current = phase;
  statusRef.current = status;

  const totalSeconds = phase === 'rest' ? restMinutes * 60 : focusMinutes * 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // startIntervalRef lets handleComplete call startInterval before it's defined
  const startIntervalRef = useRef<(totalSecs: number) => void>(() => {});

  const handleComplete = useCallback(async (completedPhase: TimerPhase) => {
    clearTimer();
    await cancelAllNotifications();
    await playCompletionSound();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (completedPhase === 'focus') {
      const record = {
        id: Date.now().toString(),
        startedAt: focusStartedAtRef.current,
        finishedAt: new Date().toISOString(),
        type: 'focus' as const,
        durationMinutes: focusMinutesRef.current,
      };
      await saveRecord(record);
      onPhaseCompleteRef.current?.('focus');

      // Automatically start rest
      const secs = restMinutesRef.current * 60;
      pausedSecondsLeftRef.current = secs;
      startTimeRef.current = Date.now();
      setPhase('rest');
      setStatus('running');
      setSecondsLeft(secs);
      startIntervalRef.current(secs);

      const id = await scheduleTimerNotification(
        'Descanso concluído!',
        'Seu descanso acabou. Vamos focar!',
        secs
      );
      notifIdRef.current = id;
    } else {
      // Rest finished — back to idle
      setStatus('idle');
      setPhase('idle');
      setSecondsLeft(focusMinutesRef.current * 60);
      onPhaseCompleteRef.current?.('rest');
    }
  }, [clearTimer]);

  const tick = useCallback((totalSecs: number) => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const left = Math.max(0, Math.round(totalSecs - elapsed));
    setSecondsLeft(left);

    if (left <= 0) {
      handleComplete(phaseRef.current);
    }
  }, [handleComplete]);

  const startInterval = useCallback((totalSecs: number) => {
    clearTimer();
    intervalRef.current = setInterval(() => tick(totalSecs), 500);
  }, [clearTimer, tick]);

  // Keep the ref in sync
  startIntervalRef.current = startInterval;

  const start = useCallback(async () => {
    const secs = focusMinutes * 60;
    pausedSecondsLeftRef.current = secs;
    startTimeRef.current = Date.now();
    focusStartedAtRef.current = new Date().toISOString();

    setPhase('focus');
    setStatus('running');
    setSecondsLeft(secs);
    startInterval(secs);

    const id = await scheduleTimerNotification(
      'Foco concluído! 🎉',
      'Seu tempo de foco acabou. Hora de descansar.',
      secs
    );
    notifIdRef.current = id;
  }, [focusMinutes, startInterval]);

  const pause = useCallback(async () => {
    clearTimer();
    setStatus('paused');
    pausedSecondsLeftRef.current = secondsLeft;
    await cancelAllNotifications();
  }, [clearTimer, secondsLeft]);

  const resume = useCallback(async () => {
    const remaining = pausedSecondsLeftRef.current;
    startTimeRef.current = Date.now() - (totalSeconds - remaining) * 1000;
    setStatus('running');
    startInterval(totalSeconds);

    const currentPhase = phaseRef.current;
    const title = currentPhase === 'focus' ? 'Foco concluído! 🎉' : 'Descanso concluído!';
    const body = currentPhase === 'focus'
      ? 'Seu tempo de foco acabou. Hora de descansar.'
      : 'Seu descanso acabou. Vamos focar!';

    const id = await scheduleTimerNotification(title, body, remaining);
    notifIdRef.current = id;
  }, [totalSeconds, startInterval]);

  const reset = useCallback(async () => {
    clearTimer();
    setStatus('idle');
    setPhase('idle');
    setSecondsLeft(focusMinutes * 60);
    pausedSecondsLeftRef.current = focusMinutes * 60;
    await cancelAllNotifications();
  }, [clearTimer, focusMinutes]);

  // Ends the rest phase early without discarding the already-saved focus record
  const finishRest = useCallback(async () => {
    clearTimer();
    setStatus('idle');
    setPhase('idle');
    setSecondsLeft(focusMinutes * 60);
    pausedSecondsLeftRef.current = focusMinutes * 60;
    await cancelAllNotifications();
  }, [clearTimer, focusMinutes]);

  const skipToRest = useCallback(async () => {
    clearTimer();
    await cancelAllNotifications();

    const record = {
      id: Date.now().toString(),
      startedAt: focusStartedAtRef.current || new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      type: 'focus' as const,
      durationMinutes: focusMinutes,
    };
    await saveRecord(record);

    const secs = restMinutes * 60;
    pausedSecondsLeftRef.current = secs;
    startTimeRef.current = Date.now();
    setPhase('rest');
    setStatus('running');
    setSecondsLeft(secs);
    startInterval(secs);

    const id = await scheduleTimerNotification(
      'Descanso concluído!',
      'Seu descanso acabou. Vamos focar!',
      secs
    );
    notifIdRef.current = id;
  }, [clearTimer, focusMinutes, restMinutes, startInterval]);

  // Handle foreground/background transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'active' && nextState === 'background') {
        clearTimer();
      } else if (nextState === 'active' && statusRef.current === 'running') {
        const currentPhase = phaseRef.current;
        const total = currentPhase === 'focus'
          ? focusMinutesRef.current * 60
          : restMinutesRef.current * 60;
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const left = Math.max(0, Math.round(total - elapsed));

        if (left <= 0) {
          handleComplete(currentPhase);
        } else {
          setSecondsLeft(left);
          startInterval(total);
        }
      }
    });

    return () => subscription.remove();
  }, [clearTimer, startInterval, handleComplete]);

  // Update display when settings change while idle
  useEffect(() => {
    if (statusRef.current === 'idle' && phaseRef.current === 'idle') {
      setSecondsLeft(focusMinutes * 60);
      pausedSecondsLeftRef.current = focusMinutes * 60;
    }
  }, [focusMinutes]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const progress = 1 - secondsLeft / totalSeconds;

  return { phase, status, secondsLeft, totalSeconds, progress, start, pause, resume, reset, skipToRest, finishRest };
}

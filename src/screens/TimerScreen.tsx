import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { TimerRing } from '../components/TimerRing';
import { useTimer, TimerPhase } from '../hooks/useTimer';
import { useSettings } from '../store/SettingsContext';
import { COLORS } from '../utils/theme';
import { Feather } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.72;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function phaseLabel(phase: TimerPhase): string {
  if (phase === 'rest') return 'DESCANSO';
  return 'FOCO';
}

interface TimerScreenProps {
  onRecordAdded?: () => void;
}

export default function TimerScreen({ onRecordAdded }: TimerScreenProps) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handlePhaseComplete = useCallback((phase: TimerPhase) => {
    if (phase === 'focus') {
      showToast('Pomodoro concluído!');
      onRecordAdded?.();
    } else {
      showToast('Descanso concluído!');
    }
  }, [onRecordAdded, showToast]);

  const timer = useTimer({
    focusMinutes: settings.focusMinutes,
    restMinutes: settings.restMinutes,
    onPhaseComplete: handlePhaseComplete,
  });

  const isFocus = timer.phase === 'focus';
  const isRest = timer.phase === 'rest';
  const isIdle = timer.phase === 'idle';
  const isRunning = timer.status === 'running';

  const accentColor = isRest ? COLORS.restAccent : COLORS.focusAccent;
  const bgFrom = isRest ? COLORS.restBgFrom : COLORS.bgFrom;
  const bgTo = isRest ? COLORS.restBgTo : COLORS.bgTo;
  const ringTrack = isRest ? COLORS.restTrack : COLORS.focusTrack;

  const displaySeconds = isIdle ? settings.focusMinutes * 60 : timer.secondsLeft;
  const displayProgress = isIdle ? 0 : timer.progress;

  const handleStop = useCallback(() => {
    Alert.alert(
      'Interromper pomodoro',
      'Tem certeza? O progresso não será salvo.',
      [
        { text: 'Continuar', style: 'cancel' },
        {
          text: 'Parar',
          style: 'destructive',
          onPress: timer.reset,
        },
      ]
    );
  }, [timer.reset]);

  return (
    <LinearGradient colors={[bgFrom, bgTo]} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 }]}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>pommo</Text>
          <View style={[styles.phaseBadge, { backgroundColor: accentColor + '30', borderColor: accentColor + '60' }]}>
            <Text style={[styles.phaseBadgeText, { color: accentColor }]}>
              {phaseLabel(timer.phase)}
            </Text>
          </View>
        </View>

        {/* Ring + Timer — ocupa o espaço flex, toast flutua sobre ele */}
        <View style={styles.timerArea}>
          <View style={styles.ringWrapper}>
            <TimerRing
              progress={displayProgress}
              color={accentColor}
              trackColor={ringTrack}
            />
            <View style={[styles.ringInner, { width: RING_SIZE, height: RING_SIZE }]}>
              <Text style={styles.timerText}>{formatTime(displaySeconds)}</Text>
            </View>
          </View>

          {/* Toast absoluto dentro do timerArea — não afeta o layout */}
          {toastMessage && (
            <View style={styles.toast} pointerEvents="none">
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {isIdle && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={timer.start}
              activeOpacity={0.8}
            >
              <Entypo name="controller-play" size={18} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.primaryButtonText}>Iniciar</Text>
            </TouchableOpacity>
          )}

          {isFocus && isRunning && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Entypo name="controller-stop" size={16} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Parar</Text>
            </TouchableOpacity>
          )}

          {isRest && isRunning && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={timer.finishRest}
              activeOpacity={0.8}
            >
              <Feather name="check-circle" size={16} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
              <Text style={styles.stopButtonText}>Encerrar descanso</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sessions info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {settings.focusMinutes}min foco · {settings.restMinutes}min descanso
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.9,
  },
  phaseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  timerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  toast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.restAccent + '30',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.restAccent + '60',
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryButton: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stopButton: {
    flexDirection: 'row',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stopButtonText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

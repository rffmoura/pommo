import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../store/SettingsContext';
import { COLORS } from '../utils/theme';

const FOCUS_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const REST_OPTIONS = [3, 5, 10, 15, 20];

interface OptionButtonProps {
  value: number;
  selected: boolean;
  onPress: () => void;
  unit: string;
  accentColor: string;
}

function OptionButton({ value, selected, onPress, unit, accentColor }: OptionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.optionBtn,
        selected && { backgroundColor: accentColor, borderColor: accentColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionBtnValue, selected && styles.optionBtnValueSelected]}>
        {value}
      </Text>
      <Text style={[styles.optionBtnUnit, selected && styles.optionBtnUnitSelected]}>
        {unit}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [focusMin, setFocusMin] = useState(settings.focusMinutes);
  const [restMin, setRestMin] = useState(settings.restMinutes);

  useEffect(() => {
    setFocusMin(settings.focusMinutes);
    setRestMin(settings.restMinutes);
  }, [settings]);

  const handleFocusChange = async (val: number) => {
    setFocusMin(val);
    await updateSettings({ focusMinutes: val });
  };

  const handleRestChange = async (val: number) => {
    setRestMin(val);
    await updateSettings({ restMinutes: val });
  };

  return (
    <LinearGradient colors={[COLORS.bgFrom, COLORS.bgTo]} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Personalize seus intervalos</Text>
        </View>

        {/* Focus duration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: COLORS.focusAccent }]} />
            <Text style={styles.sectionTitle}>Tempo de Foco</Text>
            <View style={[styles.selectedBadge, { backgroundColor: COLORS.focusAccent + '25', borderColor: COLORS.focusAccent + '50' }]}>
              <Text style={[styles.selectedBadgeText, { color: COLORS.focusAccent }]}>{focusMin} min</Text>
            </View>
          </View>
          <View style={styles.optionsRow}>
            {FOCUS_OPTIONS.map((val) => (
              <OptionButton
                key={val}
                value={val}
                selected={focusMin === val}
                onPress={() => handleFocusChange(val)}
                unit="min"
                accentColor={COLORS.focusAccent}
              />
            ))}
          </View>
        </View>

        {/* Rest duration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: COLORS.restAccent }]} />
            <Text style={styles.sectionTitle}>Tempo de Descanso</Text>
            <View style={[styles.selectedBadge, { backgroundColor: COLORS.restAccent + '25', borderColor: COLORS.restAccent + '50' }]}>
              <Text style={[styles.selectedBadgeText, { color: COLORS.restAccent }]}>{restMin} min</Text>
            </View>
          </View>
          <View style={styles.optionsRow}>
            {REST_OPTIONS.map((val) => (
              <OptionButton
                key={val}
                value={val}
                selected={restMin === val}
                onPress={() => handleRestChange(val)}
                unit="min"
                accentColor={COLORS.restAccent}
              />
            ))}
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Técnica Pomodoro</Text>
          <Text style={styles.infoText}>
            Trabalhe com foco total durante o período definido. Quando o sino tocar, faça uma pausa. Após 4 pomodoros, tire uma pausa mais longa.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    marginBottom: 4,
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
  section: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    minWidth: 58,
  },
  optionBtnValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  optionBtnValueSelected: {
    color: '#fff',
  },
  optionBtnUnit: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    marginTop: 1,
  },
  optionBtnUnitSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  infoTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    lineHeight: 21,
  },
});

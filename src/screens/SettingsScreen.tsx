import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../store/SettingsContext';
import { COLORS } from '../utils/theme';
import { Feather } from '@expo/vector-icons';

const FOCUS_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const REST_OPTIONS = [5, 10, 20];

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

interface CustomSliderProps {
  value: number;
  max: number;
  accentColor: string;
  onChange: (val: number) => void;
  onComplete: (val: number) => void;
}

function CustomSlider({ value, max, accentColor, onChange, onComplete }: CustomSliderProps) {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabelRow}>
        <Text style={[styles.sliderValue, { color: accentColor }]}>{value} min</Text>
        <Text style={styles.sliderMax}>{max} min</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        onSlidingComplete={onComplete}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor="rgba(255,255,255,0.12)"
        thumbTintColor={accentColor}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [focusMin, setFocusMin] = useState(settings.focusMinutes);
  const [restMin, setRestMin] = useState(settings.restMinutes);
  const [customFocusActive, setCustomFocusActive] = useState(false);
  const [customRestActive, setCustomRestActive] = useState(false);
  const [sliderFocusVal, setSliderFocusVal] = useState(settings.focusMinutes);
  const [sliderRestVal, setSliderRestVal] = useState(settings.restMinutes);

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

  const animate = () => LayoutAnimation.configureNext({
    duration: 200,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });

  const openFocusSlider = () => {
    animate();
    setSliderFocusVal(focusMin);
    setCustomFocusActive(true);
    setCustomRestActive(false);
  };

  const openRestSlider = () => {
    animate();
    setSliderRestVal(restMin);
    setCustomRestActive(true);
    setCustomFocusActive(false);
  };

  const focusIsCustom = !FOCUS_OPTIONS.includes(focusMin);
  const restIsCustom = !REST_OPTIONS.includes(restMin);

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
                onPress={() => { handleFocusChange(val); setCustomFocusActive(false); }}
                unit="min"
                accentColor={COLORS.focusAccent}
              />
            ))}
            <TouchableOpacity
              style={[styles.optionBtn, (focusIsCustom || customFocusActive) && { backgroundColor: COLORS.focusAccent, borderColor: COLORS.focusAccent }]}
              onPress={customFocusActive ? () => { animate(); setCustomFocusActive(false); } : openFocusSlider}
              activeOpacity={0.7}
            >
              <Feather
                name={customFocusActive ? 'check' : 'edit-2'}
                size={15}
                color={(focusIsCustom || customFocusActive) ? '#fff' : 'rgba(255,255,255,0.45)'}
              />
            </TouchableOpacity>
          </View>
          {customFocusActive && (
            <CustomSlider
              value={sliderFocusVal}
              max={120}
              accentColor={COLORS.focusAccent}
              onChange={setSliderFocusVal}
              onComplete={handleFocusChange}
            />
          )}
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
                onPress={() => { handleRestChange(val); setCustomRestActive(false); }}
                unit="min"
                accentColor={COLORS.restAccent}
              />
            ))}
            <TouchableOpacity
              style={[styles.optionBtn, (restIsCustom || customRestActive) && { backgroundColor: COLORS.restAccent, borderColor: COLORS.restAccent }]}
              onPress={customRestActive ? () => { animate(); setCustomRestActive(false); } : openRestSlider}
              activeOpacity={0.7}
            >
              <Feather
                name={customRestActive ? 'check' : 'edit-2'}
                size={15}
                color={(restIsCustom || customRestActive) ? '#fff' : 'rgba(255,255,255,0.45)'}
              />
            </TouchableOpacity>
          </View>
          {customRestActive && (
            <CustomSlider
              value={sliderRestVal}
              max={100}
              accentColor={COLORS.restAccent}
              onChange={setSliderRestVal}
              onComplete={handleRestChange}
            />
          )}
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
    justifyContent: 'center',
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
  sliderContainer: {
    gap: 4,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sliderMax: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
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

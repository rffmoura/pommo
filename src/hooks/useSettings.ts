import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, PomodoroSettings, DEFAULT_SETTINGS } from '../store/pomodoroStore';

interface UseSettingsReturn {
  settings: PomodoroSettings;
  updateSettings: (partial: Partial<PomodoroSettings>) => Promise<void>;
  loading: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<PomodoroSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  }, [settings]);

  return { settings, updateSettings, loading };
}

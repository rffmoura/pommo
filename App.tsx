import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VolumeManager } from 'react-native-volume-manager';

import TimerScreen from './src/screens/TimerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SettingsProvider } from './src/store/SettingsContext';
import { requestNotificationPermissions, setupNotificationChannels } from './src/utils/notifications';
import { COLORS } from './src/utils/theme';
import { VolumeWarningModal } from './src/components/VolumeWarningModal';
import Feather from '@expo/vector-icons/Feather';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Timer: 'clock',
    Histórico: 'list',
    Configurações: 'settings',
  };

  const iconName = (icons[name] ?? 'help-circle') as any;

  return (
    <Feather
      name={iconName}
      size={20}
      color={focused ? COLORS.focusAccent : 'rgba(255,255,255,0.4)'}
    />
  );
}

const VOLUME_WARNING_KEY = 'volumeWarning_neverShow';
const LOW_VOLUME_THRESHOLD = 0.3;

export default function App() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [autoStartRest, setAutoStartRest] = useState(false);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);

  const isFocusCompleteNotif = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const age = Date.now() - response.notification.date * 1000;
    return data?.type === 'focus_complete' && age < 2 * 60 * 60 * 1000;
  };

  useEffect(() => {
    // Pequeno delay pra garantir que o módulo nativo de áudio esteja pronto
    const timeout = setTimeout(() => {
      checkVolumeOnLaunch();
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const checkVolumeOnLaunch = async () => {
    try {
      // console.log('[VolumeCheck] Starting...');

      const neverShow = await AsyncStorage.getItem(VOLUME_WARNING_KEY);
      // console.log('[VolumeCheck] neverShow flag:', neverShow);

      if (neverShow === 'true') {
        // console.log('[VolumeCheck] User opted out, skipping.');
        return;
      }

      // No iOS, garante que estamos lendo o volume de mídia (Playback), não do ringer
      if (Platform.OS === 'ios') {
        try {
          await VolumeManager.setCategory('Playback', false);
          // console.log('[VolumeCheck] Audio category set to Playback');
        } catch (categoryError) {
          console.warn('[VolumeCheck] Failed to set category:', categoryError);
        }
      }

      const result = await VolumeManager.getVolume();
      // console.log('[VolumeCheck] Raw result:', JSON.stringify(result));

      // A lib pode retornar number direto ou { volume: number } dependendo da versão
      const volume = typeof result === 'number' ? result : result?.volume;
      // console.log('[VolumeCheck] Parsed volume:', volume, '| threshold:', LOW_VOLUME_THRESHOLD);

      if (typeof volume !== 'number') {
        console.warn('[VolumeCheck] Volume is not a number, aborting.');
        return;
      }

      if (volume < LOW_VOLUME_THRESHOLD) {
        // console.log('[VolumeCheck] Volume is low, showing modal.');
        setShowVolumeWarning(true);
      } 
    } catch (error) {
      console.error('[VolumeCheck] Failed:', error);
    }
  };

  useEffect(() => {
    setupNotificationChannels();
    requestNotificationPermissions();

    // App was closed and opened via notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && isFocusCompleteNotif(response)) setAutoStartRest(true);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((_n) => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isFocusCompleteNotif(response)) setAutoStartRest(true);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <VolumeWarningModal
        visible={showVolumeWarning}
        onDismiss={() => setShowVolumeWarning(false)}
        onNeverShow={async () => {
          await AsyncStorage.setItem(VOLUME_WARNING_KEY, 'true');
          setShowVolumeWarning(false);
        }}
      />
      <SettingsProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
              tabBarActiveTintColor: COLORS.focusAccent,
              tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarBackground: () => <View style={styles.tabBarBg} />,
            })}
          >
            <Tab.Screen name="Timer">
              {() => (
                <TimerScreen
                  onRecordAdded={() => setHistoryKey((k) => k + 1)}
                  autoStartRest={autoStartRest}
                  onAutoStartHandled={() => setAutoStartRest(false)}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Histórico">
              {() => <HistoryScreen refreshTrigger={historyKey} />}
            </Tab.Screen>
            <Tab.Screen name="Configurações">
              {() => <SettingsScreen />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: 'rgba(15,15,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
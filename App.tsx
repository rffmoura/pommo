import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import TimerScreen from './src/screens/TimerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SettingsProvider } from './src/store/SettingsContext';
import { requestNotificationPermissions, setupNotificationChannels } from './src/utils/notifications';
import { COLORS } from './src/utils/theme';
import Feather from '@expo/vector-icons/Feather'
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

export default function App() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    setupNotificationChannels();
    requestNotificationPermissions();

    notificationListener.current = Notifications.addNotificationReceivedListener((_n) => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener((_r) => {});

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
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
            tabBarBackground: () => (
              <View style={styles.tabBarBg} />
            ),
          })}
        >
          <Tab.Screen name="Timer">
            {() => <TimerScreen onRecordAdded={() => setHistoryKey((k) => k + 1)} />}
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

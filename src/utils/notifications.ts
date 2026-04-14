import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTimerNotification(
  title: string,
  body: string,
  seconds: number
): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  return id;
}

export async function showProgressNotification(
  title: string,
  body: string,
  notificationId?: string
): Promise<string> {
  if (notificationId) {
    await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
  }
  // Schedule immediately (0 second delay) as a workaround for presentNotificationAsync removal
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: null,
  });
  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

export function setupNotificationChannels(): void {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('timer', {
      name: 'Timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    Notifications.setNotificationChannelAsync('progress', {
      name: 'Timer Progress',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
    });
  }
}

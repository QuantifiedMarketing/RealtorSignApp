import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// expo-notifications must be installed: npx expo install expo-notifications
// This import is dynamic to avoid a hard crash if the package isn't yet installed.
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // package not installed yet
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;
  if (Platform.OS === 'web') return null;
  if (!Constants.isDevice) return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  await supabase.from('users').update({ push_token: token }).eq('id', userId);
}

export async function sendInstallationNotification(
  pushToken: string,
  address: string,
  jobId: string,
  photoUrl?: string,
): Promise<void> {
  const message: Record<string, unknown> = {
    to: pushToken,
    title: 'Sign Installed',
    body: `Your sign at ${address} has been installed.`,
    data: { jobId },
    sound: 'default',
  };
  if (photoUrl) {
    message.attachments = [{ url: photoUrl }];
  }
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

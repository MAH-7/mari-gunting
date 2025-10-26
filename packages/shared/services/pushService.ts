import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@mari-gunting/shared/config/supabase';

export type PushRegistrationResult = {
  token?: string;
  granted: boolean;
};

export const pushService = {
  async registerForPush(userId: string): Promise<PushRegistrationResult> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      if (!granted) {
        const req = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: false,
            allowBadge: false,
            allowSound: false,
            allowAnnouncements: false,
          },
        });
        granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      }
      if (!granted) return { granted: false };

      const { data } = await Notifications.getExpoPushTokenAsync();
      const token = data;

      // Save to DB (profiles.expo_push_token)
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);

      return { token, granted: true };
    } catch (e) {
      return { granted: false };
    }
  },
};
import { useState, useRef, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notificationRef = useRef<Notification | null>(null);

  const requestPermission = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await LocalNotifications.requestPermissions();
      const perm = result.display === 'granted' ? 'granted' : 'denied';
      setPermission(perm);
      return perm;
    } else if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions & { timestamp?: number; id?: number; ongoing?: boolean; silent?: boolean }) => {
    if (Capacitor.isNativePlatform()) {
      // ネイティブ通知
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body: options?.body || '',
              id: options?.id || new Date().getTime(),
              schedule: { at: new Date(Date.now() + 100) }, // 即時実行に近い形でスケジュール
              sound: options?.silent ? undefined : 'beep.wav',
              attachments: undefined,
              actionTypeId: "",
              extra: null,
              ongoing: options?.ongoing || false,
              autoCancel: !options?.ongoing,
            }
          ]
        });
      } catch (err) {
        console.error('LocalNotifications error:', err);
      }
    } else {
      // Web通知 (既存ロジック)
      if (permission === 'granted') {
        try {
          // Try Service Worker first
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
              const reg = await navigator.serviceWorker.ready;
              if (reg && reg.showNotification) {
                await reg.showNotification(title, options as any);
                return;
              }
            } catch (err) {
              console.warn('serviceWorker.showNotification failed', err);
            }
          }

          // Fallback: in-page Notification
          try {
            notificationRef.current = new Notification(title, options as any);
          } catch (err) {
            console.warn('Notification creation failed', err);
          }
        } catch (err) {
          console.error('showNotification error:', err);
        }
      }
    }
  }, [permission]);

  // 指定時刻に通知をスケジュールする (ネイティブのみ)
  const scheduleNotification = useCallback(async (id: number, title: string, body: string, at: Date) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              schedule: { at },
              sound: 'beep.wav',
            }
          ]
        });
      } catch (err) {
        console.error('Schedule notification error:', err);
      }
    }
  }, []);

  // 毎日繰り返し通知をスケジュールする (ネイティブのみ)
  const scheduleRepeatingNotification = useCallback(async (id: number, title: string, body: string, hour: number, minute: number) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              schedule: { 
                on: { hour, minute },
                allowWhileIdle: true,
              },
              sound: 'beep.wav',
            }
          ]
        });
      } catch (err) {
        console.error('Schedule repeating notification error:', err);
      }
    }
  }, []);

  // スケジュールされた通知をキャンセル
  const cancelNotification = useCallback(async (id: number) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id }] });
      } catch (err) {
        console.error('Cancel notification error:', err);
      }
    }
  }, []);

  const closeNotification = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleRepeatingNotification,
    cancelNotification,
    closeNotification
  };
};

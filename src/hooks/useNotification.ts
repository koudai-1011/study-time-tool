import { useState, useRef, useCallback } from 'react';

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notificationRef = useRef<Notification | null>(null);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions & { timestamp?: number }) => {
    if (permission === 'granted') {
      try {
        // Try Service Worker first
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              // Cast options to any to support timestamp which might be missing in TS types
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
  }, [permission]);

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
    closeNotification
  };
};

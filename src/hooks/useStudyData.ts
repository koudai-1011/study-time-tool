import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Settings, StudyLog, Category, NotificationSettings } from '../types';
import type { User } from 'firebase/auth';

const STORAGE_KEY = 'study-time-allocation-tool-data';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  reviewNotification: true,
  reviewNotificationTime: '09:00',
  timerProgressNotification: true,
  pomodoroProgressNotification: true,
  goalCheckNotification: true,
  goalCheckTime: '21:00',
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 0, name: 'カテゴリー1', color: '#EF4444' }, // Red
  { id: 1, name: 'カテゴリー2', color: '#F97316' }, // Orange
  { id: 2, name: 'カテゴリー3', color: '#F59E0B' }, // Amber
  { id: 3, name: 'カテゴリー4', color: '#84CC16' }, // Lime
  { id: 4, name: 'カテゴリー5', color: '#10B981' }, // Green
  { id: 5, name: 'カテゴリー6', color: '#14B8A6' }, // Teal
  { id: 6, name: 'カテゴリー7', color: '#3B82F6' }, // Blue
  { id: 7, name: 'カテゴリー8', color: '#8B5CF6' }, // Violet
  { id: 8, name: 'カテゴリー9', color: '#EC4899' }, // Pink
  { id: 9, name: 'カテゴリー10', color: '#6B7280' }, // Gray
];

export const useStudyData = (user: User | null) => {
  const [settings, setSettings] = useState<Settings>({ 
    targetHours: 0, 
    startDate: '', 
    endDate: '',
    categories: DEFAULT_CATEGORIES,
    showDailyGoalLine: true,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    dashboardLayout: {
      widgets: [
        { id: 'start_timer', visible: true, order: 0, size: 'full' },
        { id: 'pomodoro_timer', visible: true, order: 1, size: 'full' },
        { id: 'progress', visible: true, order: 2, size: 'large' },
        { id: 'daily_goal', visible: true, order: 3, size: 'small' },
        { id: 'today_study', visible: true, order: 4, size: 'small' },
        { id: 'total_study', visible: true, order: 5, size: 'small' },
        { id: 'remaining_time', visible: true, order: 6, size: 'small' },
        { id: 'category_chart', visible: true, order: 7, size: 'large' },
      ]
    }
  });
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoadingRef = useRef(true);

  // Migration function to ensure start_timer widget exists and has size
  const migrateSettings = (loadedSettings: Settings): Settings => {
    if (!loadedSettings.dashboardLayout) {
      return loadedSettings;
    }

    let widgets = loadedSettings.dashboardLayout.widgets;
    const hasStartTimer = widgets.some(w => w.id === 'start_timer');
    
    if (!hasStartTimer) {
      // Add start_timer as the first widget
      widgets = [
        { id: 'start_timer' as const, visible: true, order: 0, size: 'full' as const },
        ...widgets.map(w => ({
          ...w,
          order: w.order + 1
        }))
      ];
    }

    // Ensure all widgets have size property
    widgets = widgets.map(w => ({
      ...w,
      size: w.size || (w.id === 'start_timer' || w.id === 'pomodoro_timer' ? 'full' : 
             w.id === 'progress' || w.id === 'category_chart' || w.id === 'today_review' ? 'large' : 'small')
    }));
    
    return {
      ...loadedSettings,
      dashboardLayout: { widgets }
    };
  };

  // Load initial data
  useEffect(() => {
    isLoadingRef.current = true;
    
    if (!user) {
      // Local Storage Mode
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migratedSettings = migrateSettings({
          ...parsed.settings,
          categories: parsed.settings.categories || DEFAULT_CATEGORIES
        });
        setSettings(migratedSettings);
        setLogs(parsed.logs || []);
      }
      setIsInitialized(true);
      isLoadingRef.current = false;
    } else {
      // Firestore Mode
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const migratedSettings = migrateSettings({
            ...(data.settings || { targetHours: 0, startDate: '', endDate: '' }),
            categories: data.settings?.categories || DEFAULT_CATEGORIES
          });
          setSettings(migratedSettings);
          setLogs(data.logs || []);
        } else {
          // New User: Migrate local data to Firestore if available
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const initialSettings = {
              ...parsed.settings,
              categories: parsed.settings.categories || DEFAULT_CATEGORIES
            };
            const initialLogs = parsed.logs || [];
            
            // Set state immediately
            setSettings(initialSettings);
            setLogs(initialLogs);
            
            // Save to Firestore immediately
            setDoc(userDocRef, { settings: initialSettings, logs: initialLogs }, { merge: true });
          }
        }
        setIsInitialized(true);
        isLoadingRef.current = false;
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Save data when it changes
  useEffect(() => {
    if (!isInitialized || isLoadingRef.current) return;

    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, logs }));
    } else {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { settings, logs }, { merge: true });
    }
  }, [settings, logs, user, isInitialized]);

  return {
    settings,
    logs,
    setSettings,
    setLogs,
    DEFAULT_CATEGORIES
  };
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { differenceInCalendarDays, parseISO, startOfDay, differenceInSeconds } from 'date-fns';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface Category {
  id: number;
  name: string;
  color: string;
}

interface StudyLog {
  id: string;
  date: string; // ISO string
  duration: number; // in seconds
  categoryId: number; // 0-9
}

interface Settings {
  targetHours: number;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string; // ISO string (YYYY-MM-DD)
  categories: Category[];
}

interface StudyContextType {
  settings: Settings;
  logs: StudyLog[];
  updateSettings: (newSettings: Settings) => void;
  addLog: (duration: number, categoryId: number, date?: string) => void;
  updateLog: (logId: string, updates: Partial<StudyLog>) => void;
  deleteLog: (logId: string) => void;
  totalStudiedHours: number;
  remainingHours: number;
  daysRemaining: number;
  dailyGoalHours: number;
  todayStudiedHours: number;
  timeRemainingSeconds: number;
  getCategoryLogs: (date: string) => { category: Category; duration: number }[];
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEY = 'study-time-allocation-tool-data';

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

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({ 
    targetHours: 0, 
    startDate: '', 
    endDate: '',
    categories: DEFAULT_CATEGORIES
  });
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoadingRef = React.useRef(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data from localStorage or Firestore
  // Load initial data from localStorage or Firestore
  useEffect(() => {
    isLoadingRef.current = true;
    
    if (!user) {
      // Local Storage Mode
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...parsed.settings,
          categories: parsed.settings.categories || DEFAULT_CATEGORIES
        });
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
          setSettings({
            ...(data.settings || { targetHours: 0, startDate: '', endDate: '' }),
            categories: data.settings?.categories || DEFAULT_CATEGORIES
          });
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

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const addLog = (duration: number, categoryId: number, date: string = new Date().toISOString()) => {
    const newLog: StudyLog = {
      id: crypto.randomUUID(),
      date,
      duration,
      categoryId,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const updateLog = (logId: string, updates: Partial<StudyLog>) => {
    setLogs((prev) => prev.map(log => 
      log.id === logId ? { ...log, ...updates } : log
    ));
  };

  const deleteLog = (logId: string) => {
    setLogs((prev) => prev.filter(log => log.id !== logId));
  };

  const getCategoryLogs = (date: string) => {
    const targetDate = startOfDay(parseISO(date));
    const dayLogs = logs.filter(log => {
      const logDate = startOfDay(parseISO(log.date));
      return differenceInCalendarDays(logDate, targetDate) === 0;
    });

    const categoryMap = new Map<number, number>();
    dayLogs.forEach(log => {
      const current = categoryMap.get(log.categoryId) || 0;
      categoryMap.set(log.categoryId, current + log.duration);
    });

    return Array.from(categoryMap.entries()).map(([categoryId, duration]) => ({
      category: settings.categories.find(c => c.id === categoryId) || DEFAULT_CATEGORIES[0],
      duration
    }));
  };

  // Calculations
  const totalStudiedSeconds = logs.reduce((acc, log) => acc + log.duration, 0);
  const totalStudiedHours = totalStudiedSeconds / 3600;

  const remainingHours = Math.max(0, settings.targetHours - totalStudiedHours);

  const today = startOfDay(new Date());
  const endDateParsed = settings.endDate ? parseISO(settings.endDate) : null;
  
  const daysRemaining = endDateParsed 
    ? Math.max(0, differenceInCalendarDays(endDateParsed, today))
    : 0;

  // Real-time countdown to end date (in seconds)
  const timeRemainingSeconds = endDateParsed
    ? Math.max(0, differenceInSeconds(endDateParsed, currentTime))
    : 0;

  const dailyGoalHours = daysRemaining > 0 ? remainingHours / (daysRemaining + 1) : 0;

  const todayStudiedSeconds = logs
    .filter(log => differenceInCalendarDays(parseISO(log.date), today) === 0)
    .reduce((acc, log) => acc + log.duration, 0);
  const todayStudiedHours = todayStudiedSeconds / 3600;

  return (
    <StudyContext.Provider value={{
      settings,
      logs,
      updateSettings,
      addLog,
      updateLog,
      deleteLog,
      totalStudiedHours,
      remainingHours,
      daysRemaining,
      dailyGoalHours,
      todayStudiedHours,
      timeRemainingSeconds,
      getCategoryLogs,
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

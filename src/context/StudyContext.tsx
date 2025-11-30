import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { differenceInCalendarDays, parseISO, startOfDay, differenceInSeconds } from 'date-fns';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface StudyLog {
  id: string;
  date: string; // ISO string
  duration: number; // in seconds
}

interface Settings {
  targetHours: number;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string; // ISO string (YYYY-MM-DD)
}

interface StudyContextType {
  settings: Settings;
  logs: StudyLog[];
  updateSettings: (newSettings: Settings) => void;
  addLog: (duration: number, date?: string) => void;
  totalStudiedHours: number;
  remainingHours: number;
  daysRemaining: number;
  dailyGoalHours: number;
  todayStudiedHours: number;
  timeRemainingSeconds: number; // Real-time countdown to end date
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEY = 'study-time-allocation-tool-data';

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({ targetHours: 0, startDate: '', endDate: '' });
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data from localStorage or Firestore
  useEffect(() => {
    if (!user) {
      // Local Storage Mode
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed.settings || { targetHours: 0, startDate: '', endDate: '' });
        setLogs(parsed.logs || []);
      }
      setIsInitialized(true);
    } else {
      // Firestore Mode
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data.settings || { targetHours: 0, startDate: '', endDate: '' });
          setLogs(data.logs || []);
        }
        setIsInitialized(true);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Save data when it changes
  useEffect(() => {
    if (!isInitialized) return;

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

  const addLog = (duration: number, date: string = new Date().toISOString()) => {
    const newLog: StudyLog = {
      id: crypto.randomUUID(),
      date,
      duration,
    };
    setLogs((prev) => [...prev, newLog]);
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
      totalStudiedHours,
      remainingHours,
      daysRemaining,
      dailyGoalHours,
      todayStudiedHours,
      timeRemainingSeconds,
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

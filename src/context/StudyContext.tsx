import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { differenceInCalendarDays, parseISO, startOfDay, differenceInSeconds, endOfDay } from 'date-fns';
import { useAuth } from './AuthContext';
import type { Category, StudyLog, Settings } from '../types';
import { useStudyData } from '../hooks/useStudyData';

export type { Category, StudyLog, Settings };

interface StudyContextType {
  settings: Settings;
  logs: StudyLog[];
  updateSettings: (newSettings: Settings) => void;
  addLog: (duration: number, categoryId: number, endDate?: string) => void;
  updateLog: (logId: string, updates: Partial<StudyLog>) => void;
  deleteLog: (logId: string) => void;
  totalStudiedHours: number;
  remainingHours: number;
  daysRemaining: number;
  dailyGoalHours: number;
  todayStudiedHours: number;
  timeRemainingSeconds: number;
  getCategoryLogs: (date: string) => { category: Category; duration: number }[];
  isSwipeEnabled: boolean;
  setIsSwipeEnabled: (enabled: boolean) => void;
  setSettings: (settings: Settings) => void;
  setLogs: (logs: StudyLog[]) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings, logs, setSettings, setLogs, DEFAULT_CATEGORIES } = useStudyData(user);
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const addLog = (duration: number, categoryId: number, endDate?: string) => {
    const endTime = endDate ? new Date(endDate) : new Date();
    const startTime = new Date(endTime.getTime() - duration * 1000);
    
    // Check if the session crosses midnight
    const startDay = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
    const endDay = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
    
    if (startDay.getTime() === endDay.getTime()) {
      // Same day - create single log
      const newLog: StudyLog = {
        id: crypto.randomUUID(),
        date: endTime.toISOString(),
        duration,
        categoryId,
      };
      setLogs((prev) => [...prev, newLog]);
    } else {
      // Crosses midnight - split into multiple logs
      const logs: StudyLog[] = [];
      let currentStart = new Date(startTime);
      
      while (currentStart < endTime) {
        const currentDayEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate(), 23, 59, 59, 999);
        const segmentEnd = currentDayEnd < endTime ? currentDayEnd : endTime;
        const segmentDuration = Math.floor((segmentEnd.getTime() - currentStart.getTime()) / 1000);
        
        if (segmentDuration > 0) {
          logs.push({
            id: crypto.randomUUID(),
            date: segmentEnd.toISOString(),
            duration: segmentDuration,
            categoryId,
          });
        }
        
        // Move to next day
        currentStart = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() + 1, 0, 0, 0, 0);
      }
      
      setLogs((prev) => [...prev, ...logs]);
    }
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
    ? Math.max(0, differenceInSeconds(endOfDay(endDateParsed), currentTime))
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
      isSwipeEnabled,
      setIsSwipeEnabled,
      setSettings,
      setLogs,
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

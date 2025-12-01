import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
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

  // Dynamic update interval based on time remaining
  // - When time is low (< 1 hour): update every 1 second
  // - Otherwise: update every 60 seconds to save battery
  useEffect(() => {
    const endDateParsed = settings.endDate ? parseISO(settings.endDate) : null;
    if (!endDateParsed) return; // No end date, no need to update
    
    const calculateInterval = () => {
      const timeRemaining = differenceInSeconds(endOfDay(endDateParsed), new Date());
      return timeRemaining < 3600 ? 1000 : 60000; // 1s if < 1 hour, else 60s
    };

    let interval = calculateInterval();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Recalculate interval dynamically
      const newInterval = calculateInterval();
      if (newInterval !== interval) {
        interval = newInterval;
        clearInterval(timer);
        // Restart with new interval
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [settings.endDate]);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, [setSettings]);

  const addLog = useCallback((duration: number, categoryId: number, endDate?: string) => {
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
  }, [setLogs]);

  const updateLog = useCallback((logId: string, updates: Partial<StudyLog>) => {
    setLogs((prev) => prev.map(log => 
      log.id === logId ? { ...log, ...updates } : log
    ));
  }, [setLogs]);

  const deleteLog = useCallback((logId: string) => {
    setLogs((prev) => prev.filter(log => log.id !== logId));
  }, [setLogs]);

  const getCategoryLogs = useCallback((date: string) => {
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
  }, [logs, settings.categories, DEFAULT_CATEGORIES]);

  // Memoized calculations to prevent recalculation on every render
  const totalStudiedHours = useMemo(() => {
    const totalStudiedSeconds = logs.reduce((acc, log) => acc + log.duration, 0);
    return totalStudiedSeconds / 3600;
  }, [logs]);

  const remainingHours = useMemo(() => 
    Math.max(0, settings.targetHours - totalStudiedHours),
    [settings.targetHours, totalStudiedHours]
  );

  const { daysRemaining, timeRemainingSeconds } = useMemo(() => {
    const today = startOfDay(new Date());
    const endDateParsed = settings.endDate ? parseISO(settings.endDate) : null;
    
    const days = endDateParsed 
      ? Math.max(0, differenceInCalendarDays(endDateParsed, today))
      : 0;

    const timeSeconds = endDateParsed
      ? Math.max(0, differenceInSeconds(endOfDay(endDateParsed), currentTime))
      : 0;

    return { daysRemaining: days, timeRemainingSeconds: timeSeconds };
  }, [settings.endDate, currentTime]);

  const dailyGoalHours = useMemo(() => 
    daysRemaining > 0 ? remainingHours / (daysRemaining + 1) : 0,
    [daysRemaining, remainingHours]
  );

  const todayStudiedHours = useMemo(() => {
    const today = startOfDay(new Date());
    const todayStudiedSeconds = logs
      .filter(log => differenceInCalendarDays(parseISO(log.date), today) === 0)
      .reduce((acc, log) => acc + log.duration, 0);
    return todayStudiedSeconds / 3600;
  }, [logs]);

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

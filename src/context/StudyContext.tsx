import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { differenceInCalendarDays, parseISO, startOfDay, differenceInSeconds, endOfDay } from 'date-fns';
import { useAuth } from './AuthContext';
import type { Category, StudyLog, Settings, ReviewItem, ReviewSuggestion } from '../types';
import { useStudyData } from '../hooks/useStudyData';

export type { Category, StudyLog, Settings, ReviewItem, ReviewSuggestion };

interface StudyContextType {
  settings: Settings;
  logs: StudyLog[];
  reviewItems: ReviewItem[];
  suggestions: ReviewSuggestion[];
  updateSettings: (newSettings: Settings) => void;
  addLog: (duration: number, categoryId: number, endDate?: string) => void;
  updateLog: (logId: string, updates: Partial<StudyLog>) => void;
  deleteLog: (logId: string) => void;
  addReviewItem: (content: string, categoryId: number, baseDate?: string) => void;
  updateReviewItem: (id: string, updates: Partial<ReviewItem>) => void;
  deleteReviewItem: (id: string) => void;
  completeReview: (id: string, reviewIndex: number) => void;
  addSuggestion: (content: string, categoryId: number, useRange?: boolean, unit?: string) => void;
  deleteSuggestion: (id: string) => void;
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
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('review-items');
    return saved ? JSON.parse(saved) : [];
  });
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>(() => {
    const saved = localStorage.getItem('review-suggestions');
    return saved ? JSON.parse(saved) : [];
  });

  // 復習アイテムをlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('review-items', JSON.stringify(reviewItems));
  }, [reviewItems]);

  // サジェストをlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('review-suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  // 復習アイテムの追加
  const addReviewItem = useCallback((content: string, categoryId: number, baseDate?: string) => {
    const newItem: ReviewItem = {
      id: crypto.randomUUID(),
      content,
      categoryId,
      baseDate: baseDate || new Date().toISOString().split('T')[0],
      completedReviews: [],
      created: new Date().toISOString(),
    };
    setReviewItems(prev => [...prev, newItem]);
  }, []);

  // 復習アイテムの更新
  const updateReviewItem = useCallback((id: string, updates: Partial<ReviewItem>) => {
    setReviewItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // 復習アイテムの削除
  const deleteReviewItem = useCallback((id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // 復習完了
  const completeReview = useCallback((id: string, reviewIndex: number) => {
    setReviewItems(prev => prev.map(item => {
      if (item.id === id && !item.completedReviews.includes(reviewIndex)) {
        return { ...item, completedReviews: [...item.completedReviews, reviewIndex] };
      }
      return item;
    }));
  }, []);

  // サジェスト追加
  const addSuggestion = useCallback((content: string, categoryId: number, useRange: boolean = false, unit: string = '') => {
    const newSuggestion: ReviewSuggestion = {
      id: crypto.randomUUID(),
      content,
      categoryId,
      useRange,
      unit,
    };
    setSuggestions(prev => [...prev, newSuggestion]);
  }, []);

  // サジェスト削除
  const deleteSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

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
      reviewItems,
      suggestions,
      updateSettings,
      addLog,
      updateLog,
      deleteLog,
      addReviewItem,
      updateReviewItem,
      deleteReviewItem,
      completeReview,
      addSuggestion,
      deleteSuggestion,
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

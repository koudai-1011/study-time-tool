import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Settings, StudyLog, Category } from '../types';
import type { User } from 'firebase/auth';

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

export const useStudyData = (user: User | null) => {
  const [settings, setSettings] = useState<Settings>({ 
    targetHours: 0, 
    startDate: '', 
    endDate: '',
    categories: DEFAULT_CATEGORIES
  });
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoadingRef = useRef(true);

  // Load initial data
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

  return {
    settings,
    logs,
    setSettings,
    setLogs,
    DEFAULT_CATEGORIES
  };
};

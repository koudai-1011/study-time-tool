import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerState {
  elapsed: number;
  isRunning: boolean;
  selectedCategory: number;
  lastUpdated: number;
}

const TIMER_STORAGE_KEY = 'study-timer-state';

export const useTimer = (initialCategory: number = 0) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  // 初期化時に状態を復元
  useEffect(() => {
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        const now = Date.now();
        const timeDiff = Math.floor((now - state.lastUpdated) / 1000);
        
        // 状態を復元（計測中だった場合は経過時間に差分を加算）
        setElapsed(state.isRunning ? state.elapsed + timeDiff : state.elapsed);
        setSelectedCategory(state.selectedCategory);
        // isRunningはfalseのまま（一時停止状態で復元）
        
        // 復元後はクリア
        localStorage.removeItem(TIMER_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to restore timer state:', error);
      }
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    // リセット時はlocalStorageもクリア
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);

  // 状態変更時にlocalStorageに保存
  useEffect(() => {
    // 初回マウント時はスキップ（復元処理と競合しないため）
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 何かしら状態がある場合は保存
    if (elapsed > 0 || isRunning) {
      const state: TimerState = {
        elapsed,
        isRunning,
        selectedCategory,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } else {
      // 状態がリセットされた場合はクリア
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [elapsed, isRunning, selectedCategory]);

  useEffect(() => {
    if (isRunning) {
      if (!startTime) {
        setStartTime(Date.now() - (elapsed * 1000));
      }
      
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const actualElapsed = Math.floor((now - (startTime || now)) / 1000);
        setElapsed(actualElapsed);
      }, 1000);
    } else {
      setStartTime(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTime, elapsed]);

  return {
    isRunning,
    elapsed,
    selectedCategory,
    setSelectedCategory,
    start,
    stop,
    reset,
    startTime // Exposed for notification timestamp
  };
};

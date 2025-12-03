import { useState, useEffect, useRef, useCallback } from 'react';

interface PomodoroState {
  elapsed: number;
  isRunning: boolean;
  isBreak: boolean;
  selectedCategory: number;
  lastUpdated: number;
}

const POMODORO_STORAGE_KEY = 'pomodoro-timer-state';

export const usePomodoroTimer = (
  focusMinutes: number = 25,
  breakMinutes: number = 5,
  initialCategory: number = 0
) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;
  const targetSeconds = isBreak ? breakSeconds : focusSeconds;

  // 初期化時に状態を復元
  useEffect(() => {
    const savedState = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (savedState) {
      try {
        const state: PomodoroState = JSON.parse(savedState);
        const now = Date.now();
        const timeDiff = Math.floor((now - state.lastUpdated) / 1000);
        
        // 状態を復元（計測中だった場合は経過時間に差分を加算）
        setElapsed(state.isRunning ? state.elapsed + timeDiff : state.elapsed);
        setIsBreak(state.isBreak);
        setSelectedCategory(state.selectedCategory);
        // isRunningはfalseのまま（一時停止状態で復元）
        
        // 復元後はクリア
        localStorage.removeItem(POMODORO_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to restore pomodoro timer state:', error);
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
    localStorage.removeItem(POMODORO_STORAGE_KEY);
  }, []);

  const switchMode = useCallback(() => {
    setIsBreak(prev => !prev);
    setElapsed(0);
    setStartTime(null);
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
      const state: PomodoroState = {
        elapsed,
        isRunning,
        isBreak,
        selectedCategory,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
    } else {
      // 状態がリセットされた場合はクリア
      localStorage.removeItem(POMODORO_STORAGE_KEY);
    }
  }, [elapsed, isRunning, isBreak, selectedCategory]);

  useEffect(() => {
    if (isRunning) {
      if (!startTime) {
        setStartTime(Date.now() - (elapsed * 1000));
      }
      
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const actualElapsed = Math.floor((now - (startTime || now)) / 1000);
        setElapsed(actualElapsed);

        // Auto-switch when time is up
        if (actualElapsed >= targetSeconds) {
          setIsBreak(prev => !prev);
          setElapsed(0);
          setStartTime(Date.now());
        }
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
  }, [isRunning, startTime, elapsed, targetSeconds]);

  return {
    isRunning,
    elapsed,
    isBreak,
    selectedCategory,
    setSelectedCategory,
    start,
    stop,
    reset,
    switchMode,
    targetSeconds,
    focusSeconds,
    breakSeconds,
  };
};

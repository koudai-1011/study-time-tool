import { useState, useEffect, useRef, useCallback } from 'react';

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

  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;
  const targetSeconds = isBreak ? breakSeconds : focusSeconds;

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
  }, []);

  const switchMode = useCallback(() => {
    setIsBreak(prev => !prev);
    setElapsed(0);
    setStartTime(null);
  }, []);

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

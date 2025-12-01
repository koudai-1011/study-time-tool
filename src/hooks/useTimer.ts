import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialCategory: number = 0) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

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

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useNotification } from '../hooks/useNotification';
import { useNotificationManager } from '../hooks/useNotificationManager';

interface PomodoroTimerProps {
  onClose?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onClose }) => {
  const { addLog, settings, setIsSwipeEnabled } = useStudy();
  const notifSettings = settings.notificationSettings;
  
  const { 
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
  } = usePomodoroTimer(
    notifSettings?.pomodoroFocusMinutes || 25,
    notifSettings?.pomodoroBreakMinutes || 5,
    settings.defaultCategoryId ?? 0
  );
  
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { requestPermission, closeNotification } = useNotification();

  // Disable global swipe navigation when timer is open
  useEffect(() => {
    setIsSwipeEnabled(false);
    return () => setIsSwipeEnabled(true);
  }, [setIsSwipeEnabled]);

  // Notification manager integration
  useNotificationManager({
    elapsed,
    isRunning,
    selectedCategory,
    isPomodoroMode: true,
    isPomodoroBreak: isBreak,
  });

  // Request notification permission on start
  const handleStart = async () => {
    await requestPermission();
    start();
  };

  // Handle side effects (WakeLock)
  useEffect(() => {
    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
      closeNotification();
    }
  }, [isRunning, requestWakeLock, releaseWakeLock, closeNotification]);

  // Ensure selectedCategory is valid
  useEffect(() => {
    if (!settings?.categories || settings.categories.length === 0) return;
    const exists = settings.categories.some(c => c.id === selectedCategory);
    if (!exists) {
      setSelectedCategory(settings.categories[0].id);
    }
  }, [settings.categories, selectedCategory, setSelectedCategory]);

  const handleStop = () => {
    if (elapsed > 0 && !isBreak) {
      // Only save focus time, not break time
      addLog(elapsed, selectedCategory);
    }
    reset();
  };

  const handleClose = () => {
    if (isRunning) {
      const confirmClose = window.confirm('タイマーが実行中です。終了してもよろしいですか？');
      if (!confirmClose) return;
      handleStop();
    }
    onClose?.();
  };

  const remainingSeconds = targetSeconds - elapsed;
  const progress = (elapsed / targetSeconds) * 100;

  const CategorySelector = () => (
    <div className="grid grid-cols-5 gap-2 mb-4 justify-center mx-auto max-w-md w-full px-4">
      {settings.categories.map(category => (
        <button
          key={category.id}
          type="button"
          onClick={() => setSelectedCategory(category.id)}
          className={`p-3 rounded-lg transition-all ${selectedCategory === category.id
            ? 'ring-4 ring-primary-500 scale-110'
            : 'opacity-60 hover:opacity-100'
            }`}
          style={{ backgroundColor: category.color }}
          title={category.name}
        >
          <span className="sr-only">{category.name}</span>
          {selectedCategory === category.id && (
            <span className="block w-2 h-2 bg-white rounded-full mx-auto" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden h-[100dvh] w-screen touch-none overscroll-none"
      style={{ willChange: 'opacity, transform' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* Background Indicator */}
      <div className={`absolute top-0 left-0 w-full h-2 ${
        isBreak ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-400 to-orange-600'
      }`} />

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-lg transition-all z-50"
      >
        <X size={24} className="text-slate-600 dark:text-slate-300" />
      </button>

      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto relative z-10">
        {/* Mode indicator */}
        <div className="mb-8">
          <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg shadow-sm ${
            isBreak
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          }`}>
            🍅 {isBreak ? '休憩タイム' : '集中タイム'}
          </span>
        </div>

        <div className="mb-8 w-full">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
            選択中: {settings.categories.find(c => c.id === selectedCategory)?.name ?? '未選択'}
          </p>
          <CategorySelector />
        </div>

        {/* Progress circle */}
        <div className="relative w-64 h-64 mb-12">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ${
                isBreak ? 'text-green-500' : 'text-orange-500'
              }`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums tracking-tighter">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                残り時間
              </div>
            </div>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-4 w-full max-w-sm mb-8">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className={`flex-1 ${
                isBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              } text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg`}
            >
              <Play fill="currentColor" size={24} />
              開始
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <Pause fill="currentColor" size={24} />
              一時停止
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95 shadow-sm"
            title="終了して保存"
          >
            <Square fill="currentColor" size={24} />
          </button>
          
          <button
            onClick={switchMode}
            disabled={isRunning}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95 shadow-sm"
            title="モード切替"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Timer info */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
          集中: {focusSeconds / 60}分 / 休憩: {breakSeconds / 60}分
        </div>

        {isRunning && (
          <p className="mt-6 text-primary-600 dark:text-primary-400 font-bold animate-pulse text-lg">
            {isBreak ? 'リラックスしましょう...' : '集中モード中...'}
          </p>
        )}
      </div>
    </motion.div>
  );
};

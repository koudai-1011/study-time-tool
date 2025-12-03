import React, { useEffect } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useNotification } from '../hooks/useNotification';
import { useNotificationManager } from '../hooks/useNotificationManager';

export const PomodoroTimer: React.FC = () => {
  const { addLog, settings } = useStudy();
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

  const remainingSeconds = targetSeconds - elapsed;
  const progress = (elapsed / targetSeconds) * 100;

  const CategorySelector = () => (
    <div className="grid grid-cols-5 gap-2 mb-4 justify-center mx-auto max-w-md">
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
          {category.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-primary-900/5 border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-2 ${
        isBreak ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-400 to-orange-600'
      }`} />

      {/* Mode indicator */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
          isBreak
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        }`}>
          🍅 {isBreak ? '休憩タイム' : '集中タイム'}
        </span>
      </div>

      <CategorySelector />

      {/* Progress circle */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            className={`transition-all duration-1000 ${
              isBreak ? 'text-green-500' : 'text-orange-500'
            }`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-800 dark:text-slate-100 font-mono tabular-nums">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              残り時間
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3 w-full max-w-xs mb-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className={`flex-1 ${
              isBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
            } text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
          >
            <Play fill="currentColor" size={20} />
            開始
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Pause fill="currentColor" size={20} />
            一時停止
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={elapsed === 0}
          className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95"
          title="終了して保存"
        >
          <Square fill="currentColor" size={20} />
        </button>
        
        <button
          onClick={switchMode}
          disabled={isRunning}
          className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95"
          title="モード切替"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Timer info */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        集中: {focusSeconds / 60}分 / 休憩: {breakSeconds / 60}分
      </div>

      {isRunning && (
        <p className="mt-4 text-primary-600 dark:text-primary-400 font-medium animate-pulse">
          {isBreak ? 'リラックスしましょう...' : '集中モード中...'}
        </p>
      )}
    </div>
  );
};

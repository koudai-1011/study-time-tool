import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, X, Check } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useNotification } from '../hooks/useNotification';
import { useNotificationManager } from '../hooks/useNotificationManager';

interface PomodoroTimerProps {
  onClose?: () => void;
}

// Error boundary to catch render/runtime errors inside the Timer and show a fallback UI.
class ErrorBoundary extends React.Component<{ onClose?: () => void; children?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { onClose?: () => void; children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("PomodoroTimer ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">エラーが発生しました</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">タイマーの表示中に問題が発生しました。</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold"
            >
              再読み込み
            </button>
            {this.props.onClose && (
              <button
                onClick={this.props.onClose}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement | null;
  }
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    if (onClose) onClose();
  };

  const handleCloseClick = () => {
    if (isRunning) {
      stop(); // Pause timer
      setShowConfirmModal(true);
    } else if (elapsed > 0 && !isBreak) {
       setShowConfirmModal(true);
    } else {
      if (onClose) onClose();
    }
  };

  const handleSaveAndClose = () => {
    handleStop();
    setShowConfirmModal(false);
  };

  const handleDiscardAndClose = () => {
    reset();
    if (onClose) onClose();
    setShowConfirmModal(false);
  };

  const remainingSeconds = targetSeconds - elapsed;
  const progress = (elapsed / targetSeconds) * 100;

  const CategorySelector = () => (
    <div className="flex flex-wrap gap-2 justify-center mx-auto max-w-sm">
      {settings.categories.map(category => (
        <button
          key={category.id}
          type="button"
          onClick={() => setSelectedCategory(category.id)}
          className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
            selectedCategory === category.id
              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900/50'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: category.color }}
          title={category.name}
        >
          {selectedCategory === category.id && (
            <Check size={16} className="text-white drop-shadow" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <ErrorBoundary onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden h-[100dvh] w-screen touch-none overscroll-none bg-gradient-to-br ${
          isBreak 
            ? 'from-green-50 via-white to-green-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900' 
            : 'from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900'
        }`}
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
          onClick={handleCloseClick}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-lg transition-all z-50"
        >
          <X size={24} className="text-slate-600 dark:text-slate-300" />
        </button>

        <div className="text-center w-full max-w-lg mx-auto relative z-10">
          {/* Mode indicator */}
          <div className="mb-6">
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

          {/* Time Display */}
          <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wider mb-8 md:mb-12 tabular-nums" style={{ willChange: 'transform, opacity' }}>
            <span className="tabular-nums inline-block">{formatTime(remainingSeconds)}</span>
          </div>

          {/* Progress Bar (Simple) */}
          <div className="w-full max-w-md mx-auto h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-12 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isBreak ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-4 md:gap-6 justify-center">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className={`flex-1 max-w-[200px] ${
                  isBreak ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                } text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg md:text-xl`}
              >
                <Play fill="currentColor" size={24} className="md:w-8 md:h-8" />
                開始
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 max-w-[200px] bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg md:text-xl"
              >
                <Pause fill="currentColor" size={24} className="md:w-8 md:h-8" />
                一時停止
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={elapsed === 0}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all active:scale-95 shadow-sm"
              title="終了して保存"
            >
              <Square fill="currentColor" size={24} className="md:w-8 md:h-8" />
            </button>
            
            <button
              onClick={switchMode}
              disabled={isRunning}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all active:scale-95 shadow-sm"
              title="モード切替"
            >
              <RotateCcw size={24} className="md:w-8 md:h-8" />
            </button>
          </div>

          {/* Timer info */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium mt-8">
            集中: {focusSeconds / 60}分 / 休憩: {breakSeconds / 60}分
          </div>

          {isRunning && (
            <p className="mt-6 text-primary-600 dark:text-primary-400 font-bold animate-pulse text-lg">
              {isBreak ? 'リラックスしましょう...' : '集中モード中...'}
            </p>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">
                保存しますか？
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">
                {formatTime(elapsed)} の記録があります
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleSaveAndClose}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  保存して閉じる
                </button>
                <button
                  onClick={handleDiscardAndClose}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 rounded-xl transition-colors"
                >
                  保存せずに閉じる
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
};

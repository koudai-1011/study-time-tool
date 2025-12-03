import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';
import { useTimer } from '../hooks/useTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { useNotification } from '../hooks/useNotification';
import { useNotificationManager } from '../hooks/useNotificationManager';

interface TimerProps {
  fullscreen?: boolean;
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
    console.error("Timer ErrorBoundary caught an error", error, info);
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

export const Timer: React.FC<TimerProps> = ({ fullscreen = false, onClose }) => {
  const { addLog, settings, setIsSwipeEnabled } = useStudy();
  const { 
    isRunning, 
    elapsed, 
    selectedCategory, 
    setSelectedCategory, 
    start, 
    stop, 
    reset
  } = useTimer(settings.defaultCategoryId ?? 0);
  
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { requestPermission, closeNotification } = useNotification();
  
  // Notification manager integration for standard timer
  useNotificationManager({
    elapsed,
    isRunning,
    selectedCategory,
    isPomodoroMode: false,
    isPomodoroBreak: false,
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Disable global swipe navigation when timer is fullscreen
  useEffect(() => {
    if (fullscreen) {
      setIsSwipeEnabled(false);
      return () => setIsSwipeEnabled(true);
    }
  }, [fullscreen, setIsSwipeEnabled]);

  // Request notification permission on start (user gesture)
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
    if (elapsed > 0) {
      addLog(elapsed, selectedCategory);
    }
    reset();
    if (onClose) onClose();
  };

  const handleCloseClick = () => {
    if (elapsed > 0) {
      stop(); // Pause timer
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

  const CategorySelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={`grid ${compact ? 'grid-cols-5' : 'grid-cols-5'} gap-2 ${compact ? '' : 'mb-4'} justify-center mx-auto max-w-md`}>
      {settings.categories.map(category => (
        <button
          key={category.id}
          type="button"
          onClick={() => setSelectedCategory(category.id)}
          className={`p-3 rounded-lg transition-all ${selectedCategory === category.id
            ? 'ring-4 ring-white scale-110'
            : 'opacity-60 hover:opacity-100'
            }`}
          style={{ backgroundColor: category.color }}
          title={category.name}
        >
          {compact ? '' : category.name}
        </button>
      ))}
    </div>
  );

  if (fullscreen) {
    // Smooth animations: avoid remounting the time element each second (no key by elapsed)
    // and trigger a lightweight transform animation on change to reduce layout thrash.
    return (
      <ErrorBoundary onClose={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden h-[100dvh] w-screen touch-none overscroll-none"
          style={{ willChange: 'opacity, transform' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.preventDefault()}
        >
          <button
            onClick={handleCloseClick}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-lg transition-all"
          >
            <X size={24} className="text-slate-600 dark:text-slate-300" />
          </button>

          <div className="text-center w-full">
            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">選択中: {settings.categories.find(c => c.id === selectedCategory)?.name ?? '未選択'}</p>
              <div>
                <CategorySelector compact />
              </div>
            </div>


            
            <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wider mb-8 md:mb-12 tabular-nums" style={{ willChange: 'transform, opacity' }}>
              <span className="tabular-nums inline-block">{formatTime(elapsed)}</span>
            </div>

            <div className="flex items-center gap-4 md:gap-6 justify-center">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl"
                >
                  <Play fill="currentColor" size={24} className="md:w-8 md:h-8" />
                  開始
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl"
                >
                  <Pause fill="currentColor" size={24} className="md:w-8 md:h-8" />
                  一時停止
                </button>
              )}

              <button
                onClick={handleStop}
                disabled={elapsed === 0}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all active:scale-95"
                title="終了して保存"
              >
                <Square fill="currentColor" size={24} className="md:w-8 md:h-8" />
              </button>
            </div>

            {isRunning && (
              <p className="mt-6 md:mt-8 text-lg md:text-2xl text-primary-600 dark:text-primary-400 font-medium">
                集中モード中...
              </p>
            )}
          </div>

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
  }

  return (
    <ErrorBoundary onClose={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-primary-900/5 border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600" />

        <CategorySelector />

        <div className="text-5xl md:text-7xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wider mb-8 tabular-nums">
          {formatTime(elapsed)}
        </div>

        <div className="flex items-center gap-4 w-full max-w-xs">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" size={20} className="md:w-6 md:h-6" />
              開始
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Pause fill="currentColor" size={20} className="md:w-6 md:h-6" />
              一時停止
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95"
            title="終了して保存"
          >
            <Square fill="currentColor" size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {isRunning && (
          <p className="mt-6 text-primary-600 dark:text-primary-400 font-medium animate-pulse">
            集中モード中...
          </p>
        )}
      </div>
    </ErrorBoundary>
  );
};

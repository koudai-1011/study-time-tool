import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';

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
    console.error('ErrorBoundary caught error in Timer:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
          <div className="max-w-md w-full text-center">
            <p className="text-lg font-bold text-slate-800 mb-4">タイマーを表示できませんでした</p>
            <p className="text-sm text-slate-500 mb-6">環境によってはアプリ化（PWA）で一部機能が制限されています。ページを再読み込みするか、アプリを再起動してください。</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg"
              >
                再読み込み
              </button>
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg"
                >
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement | null;
  }
}

export const Timer: React.FC<TimerProps> = ({ fullscreen = false, onClose }) => {
  const { addLog, settings } = useStudy();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(settings.defaultCategoryId ?? 0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Update notification when elapsed changes
  useEffect(() => {
    if (isRunning && elapsed > 0 && elapsed % 10 === 0) {
      showNotification();
    }
  }, [elapsed, isRunning, selectedCategory, settings.categories, notificationPermission]);

  // Ensure selectedCategory is valid when categories change (defensive for async load)
  useEffect(() => {
    if (!settings?.categories || settings.categories.length === 0) return;
    const exists = settings.categories.some(c => c.id === selectedCategory);
    if (!exists) {
      setSelectedCategory(settings.categories[0].id);
    }
  }, [settings.categories]);

  useEffect(() => {
    if (isRunning) {
      // Set start time based on current elapsed (for resume support)
      if (!startTime) {
        setStartTime(Date.now() - (elapsed * 1000));
      }
      
      // Use timestamp-based calculation to avoid setInterval delays in background
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const actualElapsed = Math.floor((now - (startTime || now)) / 1000);
        setElapsed(actualElapsed);
      }, 1000);

      // Request wake lock
      requestWakeLock();

      // Show initial notification
      if (elapsed === 0) {
        showNotification();
      }
    } else {
      // Clear start time when stopped
      setStartTime(null);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Release wake lock
      releaseWakeLock();
      // Close notification
      closeNotification();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      releaseWakeLock();
      closeNotification();
    };
  }, [isRunning, startTime]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activated');
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  };

  // No animation: simple display to avoid jank

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  };

  const handleStart = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    setIsRunning(true);
  };

  const showNotification = async () => {
    if (notificationPermission === 'granted' && isRunning) {
      try {
        const category = settings.categories.find(c => c.id === selectedCategory) || settings.categories[0];
        // Calculate start time for the timestamp
        // If we have a tracked startTime, use it. Otherwise calculate from elapsed.
        const currentStartTime = startTime || (Date.now() - (elapsed * 1000));

        // Try Service Worker first (for background persistence)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              // TypeScript lib may not include 'renotify' in NotificationOptions type
              // so cast to any to avoid build-time error while still passing the option at runtime.
              const swOptions: any = {
                body: `${category.name}で学習中...`,
                icon: '/vite.svg',
                tag: 'study-timer',
                renotify: false, // Don't vibrate/sound on update
                silent: true,
                timestamp: currentStartTime, // OS will show "X min ago"
              };
              await reg.showNotification('学習記録', swOptions);
              return;
            }
          } catch (err) {
            console.warn('serviceWorker.showNotification failed', err);
          }
        }

        // Fallback: in-page Notification (may not update on some platforms/browsers)
        try {
          notificationRef.current = new Notification('学習記録', {
            body: `${category.name}で学習中...`,
            icon: '/vite.svg',
            tag: 'study-timer',
            requireInteraction: false,
            silent: true,
            timestamp: currentStartTime,
          } as any);
        } catch (err) {
          console.warn('Notification creation failed (likely unsupported in this environment)', err);
        }
      } catch (err) {
        console.error('showNotification error:', err);
      }
    } else if (notificationPermission !== 'granted') {
      console.warn('Notification permission not granted:', notificationPermission);
    }
  };

  const closeNotification = () => {
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  };

  const handleStop = () => {
    if (elapsed > 0) {
      addLog(elapsed, selectedCategory);
      setElapsed(0);
    }
    setIsRunning(false);
    closeNotification();
    if (fullscreen && onClose) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (elapsed > 0) {
      setShowConfirmModal(true);
    } else {
      onClose?.();
    }
  };

  const handleSaveAndClose = () => {
    handleStop();
    setShowConfirmModal(false);
  };

  const handleDiscardAndClose = () => {
    setElapsed(0);
    setIsRunning(false);
    closeNotification();
    setShowConfirmModal(false);
    onClose?.();
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
          className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col items-center justify-center p-4"
          style={{ willChange: 'opacity, transform' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCloseClick}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
          >
            <X size={24} className="text-slate-600" />
          </button>

          <div className="text-center w-full">
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">選択中: {settings.categories?.[selectedCategory]?.name ?? settings.categories?.[0]?.name ?? '未選択'}</p>
              <div>
                <CategorySelector compact />
              </div>
            </div>

            <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-slate-800 font-mono tracking-wider mb-8 md:mb-12 tabular-nums" style={{ willChange: 'transform, opacity' }}>
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
                  onClick={() => setIsRunning(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl"
                >
                  <Pause fill="currentColor" size={24} className="md:w-8 md:h-8" />
                  一時停止
                </button>
              )}

              <button
                onClick={handleStop}
                disabled={elapsed === 0}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all active:scale-95"
                title="終了して保存"
              >
                <Square fill="currentColor" size={24} className="md:w-8 md:h-8" />
              </button>
            </div>

            {isRunning && (
              <p className="mt-6 md:mt-8 text-lg md:text-2xl text-primary-600 font-medium">
                集中モード中...
              </p>
            )}
          </div>

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                  保存しますか？
                </h3>
                <p className="text-slate-600 mb-8 text-center">
                  {formatTime(elapsed)} の記録があります
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleSaveAndClose}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary-600/30 transition-all active:scale-95"
                  >
                    保存して閉じる
                  </button>
                  <button
                    onClick={handleDiscardAndClose}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all active:scale-95"
                  >
                    保存せずに閉じる
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-600 font-medium py-4 px-6 rounded-2xl border-2 border-slate-200 transition-all active:scale-95"
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
      <div className="bg-white rounded-3xl shadow-xl shadow-primary-900/5 border border-slate-100 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600" />

        <CategorySelector />

        <div className="text-5xl md:text-7xl font-bold text-slate-800 font-mono tracking-wider mb-8 tabular-nums">
          {formatTime(elapsed)}
        </div>

        <div className="flex items-center gap-4 w-full max-w-xs">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" size={20} className="md:w-6 md:h-6" />
              開始
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Pause fill="currentColor" size={20} className="md:w-6 md:h-6" />
              一時停止
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95"
            title="終了して保存"
          >
            <Square fill="currentColor" size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {isRunning && (
          <p className="mt-6 text-primary-600 font-medium animate-pulse">
            集中モード中...
          </p>
        )}
      </div>
    </ErrorBoundary>
  );
};

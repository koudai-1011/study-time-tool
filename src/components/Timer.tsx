import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';

interface TimerProps {
  fullscreen?: boolean;
  onClose?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ fullscreen = false, onClose }) => {
  const { addLog, settings } = useStudy();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
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

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      // Request wake lock
      requestWakeLock();

      // Show initial notification
      if (elapsed === 0) {
        showNotification();
      }
    } else {
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
  }, [isRunning]);

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

  // Lightweight animated time display that pulses on each second without remounting
  const AnimatedTimeDisplay: React.FC<{ elapsed: number }> = ({ elapsed }) => {
    const [pulse, setPulse] = React.useState(false);

    React.useEffect(() => {
      // trigger a short pulse animation on each update
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 140);
      return () => clearTimeout(t);
    }, [elapsed]);

    return (
      <motion.span
        className="tabular-nums inline-block"
        style={{ display: 'inline-block', willChange: 'transform' }}
        animate={{ scale: pulse ? 1.035 : 1 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        {formatTime(elapsed)}
      </motion.span>
    );
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  };

  const showNotification = async () => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      try {
        // Close previous notification
        closeNotification();

        const category = settings.categories?.[selectedCategory] ?? settings.categories?.[0] ?? { name: '未選択', color: '#9CA3AF' };
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        const timeText = hours > 0
          ? `${hours}時間${minutes}分${seconds}秒`
          : minutes > 0
            ? `${minutes}分${seconds}秒`
            : `${seconds}秒`;

        // First try: service worker notification (supports renotify)
        if ('serviceWorker' in navigator && navigator.serviceWorker) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && reg.showNotification) {
              // TypeScript lib may not include 'renotify' in NotificationOptions type
              // so cast to any to avoid build-time error while still passing the option at runtime.
              const swOptions: any = {
                body: `${category.name}: ${timeText}`,
                icon: '/vite.svg',
                tag: 'study-timer',
                renotify: true,
                silent: true,
              };
              await reg.showNotification('学習記録 - タイマー実行中', swOptions);
              return;
            }
          } catch (err) {
            console.warn('serviceWorker.showNotification failed', err);
          }
        }

        // Fallback: in-page Notification (may not update on some platforms/browsers)
        try {
          notificationRef.current = new Notification('学習記録 - タイマー実行中', {
            body: `${category.name}: ${timeText}`,
            icon: '/vite.svg',
            tag: 'study-timer',
            requireInteraction: false,
            silent: true,
          });
        } catch (err) {
          console.warn('Notification creation failed (likely unsupported in this environment)', err);
        }
      } catch (err) {
        console.error('showNotification error:', err);
      }
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

  const CategorySelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={`grid ${compact ? 'grid-cols-5' : 'grid-cols-5'} gap-2 ${compact ? '' : 'mb-4'}`}>
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
          className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col items-center justify-center p-4"
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.05 } }}
          >
            <X size={24} className="text-slate-600" />
          </motion.button>

          <div className="text-center w-full max-w-2xl">
            <motion.div className="mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <p className="text-sm text-slate-600 mb-2">選択中: {settings.categories?.[selectedCategory]?.name ?? settings.categories?.[0]?.name ?? '未選択'}</p>
              <motion.div initial="hidden" animate="visible" transition={{ delay: 0.08 }}>
                <CategorySelector compact />
              </motion.div>
            </motion.div>

            <motion.div
              className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-slate-800 font-mono tracking-wider mb-8 md:mb-12 tabular-nums"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ willChange: 'transform, opacity' }}
            >
              <AnimatedTimeDisplay elapsed={elapsed} />
            </motion.div>

            <motion.div className="flex items-center gap-4 md:gap-6 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              {!isRunning ? (
                <motion.button
                  onClick={() => setIsRunning(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play fill="currentColor" size={24} className="md:w-8 md:h-8" />
                  開始
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setIsRunning(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 md:py-6 md:px-12 rounded-2xl md:rounded-3xl shadow-2xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-lg md:text-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Pause fill="currentColor" size={24} className="md:w-8 md:h-8" />
                  一時停止
                </motion.button>
              )}

              <motion.button
                onClick={handleStop}
                disabled={elapsed === 0}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all active:scale-95"
                title="終了して保存"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Square fill="currentColor" size={24} className="md:w-8 md:h-8" />
              </motion.button>
            </motion.div>

            {isRunning && (
              <motion.p className="mt-6 md:mt-8 text-lg md:text-2xl text-primary-600 font-medium"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
              >
                集中モード中...
              </motion.p>
            )}
          </div>
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

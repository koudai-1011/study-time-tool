import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTime } from '../utils/timeFormat';

interface TimerProps {
  fullscreen?: boolean;
  onClose?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ fullscreen = false, onClose }) => {
  const { addLog } = useStudy();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStop = () => {
    if (elapsed > 0) {
      addLog(elapsed);
      setElapsed(0);
    }
    setIsRunning(false);
    if (fullscreen && onClose) {
      onClose();
    }
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col items-center justify-center p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
        >
          <X size={24} className="text-slate-600" />
        </button>

        <div className="text-center">
          <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-slate-800 font-mono tracking-wider mb-8 md:mb-12 tabular-nums">
            {formatTime(elapsed)}
          </div>

          <div className="flex items-center gap-4 md:gap-6 justify-center">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
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
            <p className="mt-6 md:mt-8 text-lg md:text-2xl text-primary-600 font-medium animate-pulse">
              集中モード中...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-primary-900/5 border border-slate-100 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600" />
      
      <div className="text-5xl md:text-7xl font-bold text-slate-800 font-mono tracking-wider mb-8 tabular-nums">
        {formatTime(elapsed)}
      </div>

      <div className="flex items-center gap-4 w-full max-w-xs">
        {!isRunning ? (
          <button
            onClick={() => setIsRunning(true)}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play fill="currentColor" />
            開始
          </button>
        ) : (
          <button
            onClick={() => setIsRunning(false)}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Pause fill="currentColor" />
            一時停止
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={elapsed === 0}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold p-4 rounded-2xl transition-all active:scale-95"
          title="終了して保存"
        >
          <Square fill="currentColor" />
        </button>
      </div>
      
      {isRunning && (
        <p className="mt-6 text-primary-600 font-medium animate-pulse">
          集中モード中...
        </p>
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { calculateStreak } from '../../utils/streakCalculator';

export const StreakWidget: React.FC<{ isSmall?: boolean }> = ({ isSmall }) => {
  const { logs } = useStudy();

  const streak = useMemo(() => calculateStreak(logs), [logs]);

  // ストリークに応じたメッセージと色
  const getStreakInfo = (days: number) => {
    if (days === 0) return { message: '今日から再開！', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' };
    if (days < 3) return { message: 'いい調子！', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    if (days < 7) return { message: '素晴らしい！', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { message: '凄まじい集中力！', color: 'text-red-600', bg: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30' };
  };

  const info = getStreakInfo(streak);

  if (isSmall) {
    return (
      <div className={`w-full h-full ${info.bg} rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-md`}>
        <Flame className={info.color} size={20} fill={streak > 0 ? "currentColor" : "none"} />
        <span className={`font-bold text-slate-800 dark:text-slate-100 text-sm mt-1`}>
          {streak}日
        </span>
        <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">連続</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${info.bg} rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800 shadow-md flex flex-col justify-center items-center relative overflow-hidden`}>
      {/* 背景の装飾 */}
      {streak > 0 && (
        <motion.div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          animate={{ 
            background: [
              'radial-gradient(circle at 30% 30%, orange, transparent 50%)',
              'radial-gradient(circle at 70% 70%, red, transparent 50%)',
              'radial-gradient(circle at 30% 30%, orange, transparent 50%)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      )}

      <div className="flex items-center gap-2 mb-1 z-10">
        <Flame className={info.color} size={24} fill={streak > 0 ? "currentColor" : "none"} />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">継続日数</span>
      </div>
      
      <div className="flex items-baseline gap-1 z-10">
        <span className={`text-4xl font-black ${info.color} drop-shadow-sm`}>
          {streak}
        </span>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">日</span>
      </div>
      
      <div className="mt-2 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm z-10">
        <span className={`text-xs font-bold ${info.color}`}>
          {info.message}
        </span>
      </div>
    </div>
  );
};

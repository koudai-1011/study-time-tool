import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateYMD, getMonthlyReviewCounts } from '../utils/reviewSchedule';
import type { ReviewItem } from '../types';

interface ReviewCalendarProps {
  items: ReviewItem[];
  intervals: number[];
}

export const ReviewCalendar: React.FC<ReviewCalendarProps> = ({ items, intervals }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthlyCount = getMonthlyReviewCounts(items, year, month + 1, intervals);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // カレンダーのグリッド（前月の末尾の日も含む）
  const calendarDays: Array<{ date: number; isCurrentMonth: boolean; dateKey: string }> = [];
  
  // 前月の日付
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const d = new Date(year, month - 1, day);
    calendarDays.push({ date: day, isCurrentMonth: false, dateKey: formatDateYMD(d) });
  }
  
  // 今月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarDays.push({ date: day, isCurrentMonth: true, dateKey: formatDateYMD(d) });
  }
  
  // 次月の日付（7の倍数になるまで）
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const d = new Date(year, month + 1, day);
      calendarDays.push({ date: day, isCurrentMonth: false, dateKey: formatDateYMD(d) });
    }
  }

  const today = formatDateYMD(new Date());

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="text-slate-600 dark:text-slate-400" />
        </motion.button>
        
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {year}年{month + 1}月
        </h3>
        
        <motion.button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="text-slate-600 dark:text-slate-400" />
        </motion.button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
          <div 
            key={day} 
            className={`text-center text-xs md:text-sm font-semibold uppercase tracking-wider ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(({ date, isCurrentMonth, dateKey }, index) => {
          const count = monthlyCount.get(dateKey) || 0;
          const isToday = dateKey === today;
          const dayOfWeek = index % 7;
          
          return (
            <motion.div
              key={index}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all ${
                isCurrentMonth
                  ? count > 0
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-30'
              } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              whileHover={isCurrentMonth ? { scale: 1.05 } : {}}
            >
              <span
                className={`text-sm font-medium ${
                  isToday
                    ? 'text-primary-600 dark:text-primary-400 font-bold'
                    : isCurrentMonth
                    ? dayOfWeek === 0
                      ? 'text-red-600 dark:text-red-400'
                      : dayOfWeek === 6
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-200'
                    : 'text-slate-400'
                }`}
              >
                {date}
              </span>
              
              {count > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400"
                    />
                  ))}
                  {count > 3 && (
                    <span className="text-[8px] text-primary-600 dark:text-primary-400 font-bold">
                      +{count - 3}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-600 dark:bg-primary-400" />
          <span>復習予定あり</span>
        </div>
      </div>
    </div>
  );
};

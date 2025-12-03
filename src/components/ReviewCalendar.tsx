import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { formatDateYMD, getReviewsForDate } from '../utils/reviewSchedule';
import { useStudy } from '../context/StudyContext';
import type { ReviewItem } from '../types';

interface ReviewCalendarProps {
  items: ReviewItem[];
  intervals: number[];
}

export const ReviewCalendar: React.FC<ReviewCalendarProps> = ({ items, intervals }) => {
  const { settings, completeReview } = useStudy();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dateKey: string, count: number) => {
    if (count > 0) {
      setSelectedDate(dateKey);
    }
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
  const selectedReviews = selectedDate ? getReviewsForDate(items, selectedDate, intervals) : [];

  const labels = ['1日目', '3日目', '7日目', '14日目', '30日目', '60日目'];

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
          const reviewsForDate = getReviewsForDate(items, dateKey, intervals);
          const count = reviewsForDate.length;
          const isToday = dateKey === today;
          const dayOfWeek = index % 7;
          
          // その日の復習に含まれるカテゴリの色を取得（最大4つ）
          const categoryColors = reviewsForDate
            .map(item => settings.categories.find(c => c.id === item.categoryId)?.color)
            .filter((color, index, self) => color && self.indexOf(color) === index) // 重複削除
            .slice(0, 4);
          
          return (
            <motion.button
              key={index}
              onClick={() => handleDateClick(dateKey, count)}
              disabled={count === 0}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all ${
                isCurrentMonth
                  ? count > 0
                    ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-30'
              } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              whileHover={isCurrentMonth && count > 0 ? { scale: 1.05 } : {}}
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
                  {categoryColors.map((color, i) => (
                    <div 
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {count > 4 && (
                    <span className="text-[8px] text-slate-600 dark:text-slate-400 font-bold ml-0.5">
                      +{count - 4}
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {selectedDate} の復習
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto">
                {selectedReviews.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">この日の復習はありません</p>
                ) : (
                  selectedReviews.map(item => {
                    const category = settings.categories.find(c => c.id === item.categoryId);
                    const label = item.reviewIndex < labels.length ? labels[item.reviewIndex] : '復習';
                    
                    return (
                      <div
                        key={`${item.id}-${item.reviewIndex}`}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: category?.color }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{item.content}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                        </div>
                        <button
                          onClick={() => {
                            completeReview(item.id, item.reviewIndex);
                          }}
                          className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                        >
                          <CheckCircle size={20} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

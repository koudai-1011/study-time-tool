import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { getTodayReviews, calculateReviewDates, formatDateYMD, DEFAULT_REVIEW_INTERVALS } from '../utils/reviewSchedule';

export const TodayReviewWidget: React.FC = () => {
  const { reviewItems, completeReview, settings } = useStudy();
  const intervals = settings.reviewSettings?.intervals || DEFAULT_REVIEW_INTERVALS;
  const todayReviews = getTodayReviews(reviewItems, intervals);

  const labels = ['1日目', '3日目', '7日目', '14日目', '30日目', '60日目'];

  return (
    <motion.div
      className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <BookOpen className="text-primary-600 dark:text-primary-400" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">今日の復習</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{todayReviews.length}件</p>
        </div>
      </div>

      {todayReviews.length === 0 ? (
        <p className="text-center py-6 text-slate-400 text-sm">今日の復習はありません</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todayReviews.map(item => {
            const category = settings.categories.find(c => c.id === item.categoryId);
            const schedules = calculateReviewDates(item.baseDate, intervals);
            const todayIndex = schedules.findIndex(date => date === formatDateYMD(new Date()));

            return (
              <motion.div
                key={item.id}
                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div
                  className="w-8 h-8 rounded-md flex-shrink-0"
                  style={{ backgroundColor: category?.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                    {item.content}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {todayIndex >= 0 && todayIndex < labels.length ? labels[todayIndex] : '復習'}
                  </p>
                </div>
                <button
                  onClick={() => completeReview(item.id, todayIndex)}
                  className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors flex-shrink-0"
                >
                  <CheckCircle size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

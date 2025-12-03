import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { getTodayReviews, formatDateYMD, calculateReviewDates, DEFAULT_REVIEW_INTERVALS } from '../utils/reviewSchedule';
import { ReviewCalendar } from './ReviewCalendar';

export const ReviewScreen: React.FC = () => {
  const { reviewItems, addReviewItem, deleteReviewItem, completeReview, settings } = useStudy();
  const [newContent, setNewContent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(settings.categories[0]?.id || 0);
  const [showCalendar, setShowCalendar] = useState(false);

  const intervals = settings.reviewSettings?.intervals || DEFAULT_REVIEW_INTERVALS;
  const todayReviews = getTodayReviews(reviewItems, intervals);

  const handleAdd = () => {
    if (newContent.trim()) {
      addReviewItem(newContent.trim(), newCategoryId);
      setNewContent('');
    }
  };

  const labels = ['1日目', '3日目', '7日目', '14日目', '30日目', '60日目'];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">復習管理</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            エビングハウスの忘却曲線に基づく効率的な復習
          </p>
        </div>
        <motion.button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            showCalendar
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CalendarIcon size={20} />
          カレンダー表示
        </motion.button>
      </header>

      {showCalendar && <ReviewCalendar items={reviewItems} intervals={intervals} />}

      {/* 入力欄 */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">新しい学習項目を追加</h3>
        <div className="space-y-4">
          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              カテゴリ
            </label>
            <div className="grid grid-cols-5 gap-2">
              {settings.categories.map(category => (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() => setNewCategoryId(category.id)}
                  className={`p-3 rounded-lg transition-all ${
                    newCategoryId === category.id
                      ? 'ring-4 ring-primary-600 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: category.color }}
                  title={category.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
          </div>

          {/* 内容入力 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              学習内容
            </label>
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="例：英単語100個、微分積分の公式"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          <motion.button
            onClick={handleAdd}
            disabled={!newContent.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            whileHover={{ scale: newContent.trim() ? 1.02 : 1 }}
            whileTap={{ scale: newContent.trim() ? 0.98 : 1 }}
          >
            <Plus size={20} />
            追加
          </motion.button>
        </div>
      </div>

      {/* 今日の復習 */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          今日の復習 ({todayReviews.length}件)
        </h3>
        
        {todayReviews.length === 0 ? (
          <p className="text-center py-8 text-slate-400">今日の復習はありません</p>
        ) : (
          <div className="space-y-3">
            {todayReviews.map(item => {
              const category = settings.categories.find(c => c.id === item.categoryId);
              const schedules = calculateReviewDates(item.baseDate, intervals);
              const todayIndex = schedules.findIndex(date => date === formatDateYMD(new Date()));
              
              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category?.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.content}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {todayIndex >= 0 && todayIndex < labels.length ? labels[todayIndex] : '復習'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => completeReview(item.id, todayIndex)}
                    className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CheckCircle size={24} />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 全項目リスト */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
          全項目 ({reviewItems.length}件)
        </h3>
        
        {reviewItems.length === 0 ? (
          <p className="text-center py-8 text-slate-400">項目がありません</p>
        ) : (
          <div className="space-y-3">
            {reviewItems.map(item => {
              const category = settings.categories.find(c => c.id === item.categoryId);
              const progress = `${item.completedReviews.length}/${intervals.length}`;
              
              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category?.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.content}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      進捗: {progress} | 基準日: {item.baseDate}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => deleteReviewItem(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={20} />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

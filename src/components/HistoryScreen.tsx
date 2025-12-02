import React, { useState } from 'react';
import { CalendarView } from './CalendarView';
import { TrendingUp, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryScreen: React.FC = () => {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">学習履歴</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">これまでの学習記録と分析データを確認できます。</p>
      </header>

      {/* Calendar Section */}
      <section>
        <CalendarView />
      </section>

      {/* Analytics Section (Accordion) */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">詳細分析</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">グラフで推移を確認</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isAnalyticsOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="text-slate-400 dark:text-slate-500" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isAnalyticsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => setShowProgressModal(true)}
                    className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">進捗率の推移</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">目標達成度の変化を確認</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setShowStudyTimeModal(true)}
                    className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">学習時間の推移</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">日々の学習量を確認</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Modals */}
      {showProgressModal && (
        <ProgressDetailModal onClose={() => setShowProgressModal(false)} />
      )}

      {showStudyTimeModal && (
        <StudyTimeDetailModal onClose={() => setShowStudyTimeModal(false)} />
      )}
    </div>
  );
};

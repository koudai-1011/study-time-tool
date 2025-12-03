import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2 } from 'lucide-react';
import type { DashboardWidget } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { StatCard } from './StatCard';
import { CategoryChart } from './CategoryChart';

import { SabotageModal } from './SabotageModal';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

export const Dashboard: React.FC = () => {
  const {
    totalStudiedHours,
    todayStudiedHours,
    settings,
    timeRemainingSeconds
  } = useStudy();

  const progress = settings.targetHours > 0
    ? Math.min(100, (totalStudiedHours / settings.targetHours) * 100)
    : 0;

  const [fullscreenTimer, setFullscreenTimer] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time daily goal calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate daily goal based on current time
  const now = currentTime;
  const endDateParsed = settings.endDate ? new Date(settings.endDate) : null;
  const timeUntilEnd = endDateParsed ? Math.max(0, endDateParsed.getTime() - now.getTime()) : 0;
  const hoursUntilEnd = timeUntilEnd / (1000 * 60 * 60);
  const remainingHoursToStudy = Math.max(0, settings.targetHours - totalStudiedHours);
  // Real-time daily goal (hours/day) that updates every second as remaining time decreases.
  const realtimeDailyGoal = hoursUntilEnd > 0 ? (remainingHoursToStudy / hoursUntilEnd) * 24 : 0;

  // Default widgets definition
  const defaultWidgets: DashboardWidget[] = [
    { id: 'start_timer', visible: true, order: 0 },
    { id: 'pomodoro_timer', visible: true, order: 1 },
    { id: 'progress', visible: true, order: 2 },
    { id: 'daily_goal', visible: true, order: 3 },
    { id: 'today_study', visible: true, order: 4 },
    { id: 'total_study', visible: true, order: 5 },
    { id: 'remaining_time', visible: true, order: 6 },
    { id: 'category_chart', visible: true, order: 7 },
  ];

  // Merge saved layout with default widgets to ensure new widgets appear
  const layout = {
    widgets: defaultWidgets.map(defaultWidget => {
      const savedWidget = settings.dashboardLayout?.widgets.find(w => w.id === defaultWidget.id);
      return savedWidget || defaultWidget;
    }).sort((a, b) => a.order - b.order)
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">ダッシュボード</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Dynamic Widgets */}
        {layout.widgets
          .filter(w => w.visible)
          .map((widget) => {
            switch (widget.id) {
              case 'start_timer':
                return (
                  <motion.button
                    key="start_timer"
                    onClick={() => setFullscreenTimer(true)}
                    className="col-span-1 md:col-span-2 lg:col-span-4 w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 dark:from-primary-500 dark:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 text-white font-bold py-6 rounded-2xl shadow-xl shadow-primary-600/30 dark:shadow-primary-500/20 transition-all flex items-center justify-center gap-3 text-lg"
                    whileHover={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Maximize2 size={24} />
                    計測開始
                  </motion.button>
                );

              case 'pomodoro_timer':
                return (
                  <motion.button
                    key="pomodoro_timer"
                    onClick={() => setShowPomodoroTimer(true)}
                    className="col-span-1 md:col-span-2 lg:col-span-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 text-white font-bold py-6 rounded-2xl shadow-xl shadow-orange-500/30 dark:shadow-orange-600/20 transition-all flex items-center justify-center gap-3 text-lg"
                    whileHover={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
                  >
                    <Clock size={24} />
                    ポモドーロタイマー開始
                  </motion.button>
                );

              case 'progress':
                return (
                  <motion.div
                    key="progress"
                    className="col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowProgressModal(true)}
                  >
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-2">
                          <Target size={18} />
                          全体の進捗
                        </h3>
                        <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                          {progress.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 dark:text-slate-400">目標まで</div>
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {Math.max(0, settings.targetHours - totalStudiedHours).toFixed(1)}時間
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                      目標: {settings.targetHours}時間 / 現在: {totalStudiedHours.toFixed(1)}時間
                    </p>
                  </motion.div>
                );

              case 'daily_goal':
                return (
                  <StatCard
                    key="daily_goal"
                    icon={<Calendar className="text-blue-500" size={24} />}
                    label="1日の目標"
                    value={formatTimeJapanese(realtimeDailyGoal)}
                    subtext="目標期限から算出"
                    color="bg-blue-50 dark:bg-blue-900/20"
                    onClick={() => setShowStudyTimeModal(true)}
                  />
                );

              case 'today_study':
                return (
                  <StatCard
                    key="today_study"
                    icon={<Clock className="text-green-500" size={24} />}
                    label="今日の学習"
                    value={formatTimeJapanese(todayStudiedHours)}
                    subtext={todayStudiedHours >= realtimeDailyGoal ? "目標達成！" : `あと${Math.max(0, realtimeDailyGoal - todayStudiedHours).toFixed(1)}時間`}
                    color="bg-green-50 dark:bg-green-900/20"
                    onClick={() => setShowStudyTimeModal(true)}
                  />
                );

              case 'total_study':
                return (
                  <StatCard
                    key="total_study"
                    icon={<TrendingUp className="text-purple-500" size={24} />}
                    label="総学習時間"
                    value={formatTimeJapanese(totalStudiedHours)}
                    subtext="積み上げ中"
                    color="bg-purple-50 dark:bg-purple-900/20"
                    onClick={() => setShowStudyTimeModal(true)}
                  />
                );

              case 'remaining_time':
                return (
                  <StatCard
                    key="remaining_time"
                    icon={<Clock className="text-orange-500" size={24} />}
                    label="残り時間"
                    value={formatCountdownJapanese(timeRemainingSeconds)}
                    subtext={settings.endDate ? `期限: ${settings.endDate}` : '期限なし'}
                    color="bg-orange-50 dark:bg-orange-900/20"
                  />
                );

              case 'category_chart':
                return (
                  <div key="category_chart" className="col-span-1 md:col-span-2 lg:col-span-2">
                    <CategoryChart />
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {fullscreenTimer && (
          <Timer fullscreen onClose={() => setFullscreenTimer(false)} />
        )}
        {showPomodoroTimer && (
          <PomodoroTimer onClose={() => setShowPomodoroTimer(false)} />
        )}
        {showSabotageModal && (
          <SabotageModal 
            dailyGoalHours={realtimeDailyGoal} 
            onClose={() => setShowSabotageModal(false)} 
          />
        )}
        {showProgressModal && (
          <ProgressDetailModal onClose={() => setShowProgressModal(false)} />
        )}
        {showStudyTimeModal && (
          <StudyTimeDetailModal onClose={() => setShowStudyTimeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};


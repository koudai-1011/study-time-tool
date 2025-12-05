import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2 } from 'lucide-react';
import type { DashboardWidget, DashboardWidgetSize } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { StatCard } from './StatCard';
import { CategoryChart } from './CategoryChart';
import { TodayReviewWidget } from './TodayReviewWidget';

import { SabotageModal } from './SabotageModal';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

// サイズに応じたグリッドクラスを返す
const getSizeClass = (size: DashboardWidgetSize): string => {
  switch (size) {
    case 'small':
      return 'col-span-1';
    case 'medium':
      return 'col-span-1 row-span-2';
    case 'large':
      return 'col-span-2';
    case 'full':
      return 'col-span-2';
    default:
      return 'col-span-1';
  }
};

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

  // Default widgets definition with size
  const reviewEnabled = settings.reviewSettings?.enabled || false;
  const defaultWidgets: DashboardWidget[] = [
    { id: 'start_timer', visible: true, order: 0, size: 'full' },
    { id: 'pomodoro_timer', visible: true, order: 1, size: 'full' },
    { id: 'progress', visible: true, order: 2, size: 'large' },
    { id: 'daily_goal', visible: true, order: 3, size: 'small' },
    { id: 'today_study', visible: true, order: 4, size: 'small' },
    { id: 'total_study', visible: true, order: 5, size: 'small' },
    { id: 'remaining_time', visible: true, order: 6, size: 'small' },
    { id: 'category_chart', visible: true, order: 7, size: 'large' },
    ...(reviewEnabled ? [{ id: 'today_review' as const, visible: true, order: 8, size: 'large' as const }] : []),
  ];

  // Merge saved layout with default widgets to ensure new widgets appear
  const layout = {
    widgets: defaultWidgets.map(defaultWidget => {
      const savedWidget = settings.dashboardLayout?.widgets.find(w => w.id === defaultWidget.id);
      return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
    }).sort((a, b) => a.order - b.order)
  };

  // ウィジェットをレンダリング
  const renderWidget = (widget: DashboardWidget) => {
    const sizeClass = getSizeClass(widget.size);
    
    switch (widget.id) {
      case 'start_timer':
        return (
          <motion.button
            key="start_timer"
            onClick={() => setFullscreenTimer(true)}
            className={`${sizeClass} bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 dark:from-primary-500 dark:to-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2`}
            whileTap={{ scale: 0.98 }}
          >
            <Maximize2 size={20} />
            計測開始
          </motion.button>
        );

      case 'pomodoro_timer':
        return (
          <motion.button
            key="pomodoro_timer"
            onClick={() => setShowPomodoroTimer(true)}
            className={`${sizeClass} bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2`}
            whileTap={{ scale: 0.98 }}
          >
            <Clock size={20} />
            ポモドーロ
          </motion.button>
        );

      case 'progress':
        return (
          <motion.div
            key="progress"
            className={`${sizeClass} bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer`}
            onClick={() => setShowProgressModal(true)}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">全体の進捗</span>
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{progress.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              あと{Math.max(0, settings.targetHours - totalStudiedHours).toFixed(1)}時間
            </p>
          </motion.div>
        );

      case 'daily_goal':
        return (
          <div key="daily_goal" className={sizeClass}>
            <StatCard
              icon={<Calendar className="text-blue-500" size={20} />}
              label="1日の目標"
              value={formatTimeJapanese(realtimeDailyGoal)}
              subtext="目標期限から算出"
              color="bg-blue-50 dark:bg-blue-900/20"
              onClick={() => setShowStudyTimeModal(true)}
              compact
            />
          </div>
        );

      case 'today_study':
        return (
          <div key="today_study" className={sizeClass}>
            <StatCard
              icon={<Clock className="text-green-500" size={20} />}
              label="今日の学習"
              value={formatTimeJapanese(todayStudiedHours)}
              subtext={todayStudiedHours >= realtimeDailyGoal ? "目標達成！" : `あと${Math.max(0, realtimeDailyGoal - todayStudiedHours).toFixed(1)}h`}
              color="bg-green-50 dark:bg-green-900/20"
              onClick={() => setShowStudyTimeModal(true)}
              compact
            />
          </div>
        );

      case 'total_study':
        return (
          <div key="total_study" className={sizeClass}>
            <StatCard
              icon={<TrendingUp className="text-purple-500" size={20} />}
              label="総学習時間"
              value={formatTimeJapanese(totalStudiedHours)}
              subtext="積み上げ中"
              color="bg-purple-50 dark:bg-purple-900/20"
              onClick={() => setShowStudyTimeModal(true)}
              compact
            />
          </div>
        );

      case 'remaining_time':
        return (
          <div key="remaining_time" className={sizeClass}>
            <StatCard
              icon={<Clock className="text-orange-500" size={20} />}
              label="残り時間"
              value={formatCountdownJapanese(timeRemainingSeconds)}
              subtext={settings.endDate ? `期限: ${settings.endDate}` : '期限なし'}
              color="bg-orange-50 dark:bg-orange-900/20"
              compact
            />
          </div>
        );

      case 'category_chart':
        return (
          <div key="category_chart" className={sizeClass}>
            <CategoryChart />
          </div>
        );

      case 'today_review':
        return (
          <div key="today_review" className={sizeClass}>
            <TodayReviewWidget />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ダッシュボード</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
      </header>

      {/* ウィジェットグリッド - iPhone風2列レイアウト */}
      <div className="grid grid-cols-2 gap-3">
        {layout.widgets
          .filter(w => w.visible)
          .map((widget) => renderWidget(widget))}
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

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { Target, Calendar, Clock, TrendingUp, Maximize2 } from 'lucide-react';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { StatCard } from './StatCard';

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

  return (
    <>
      <div className="space-y-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">ダッシュボード</h2>
          <p className="text-slate-500 mt-2">進捗を確認して、集中力を維持しましょう。</p>
        </header>

        {/* Timer Button at Top */}
        <motion.button
          onClick={() => setFullscreenTimer(true)}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-6 rounded-2xl shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3 text-lg"
          whileHover={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Maximize2 size={24} />
          計測開始
        </motion.button>

        {/* Progress Section */}
        <motion.div
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">全体の進捗</h3>

          <div className="relative pt-4">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                  進捗率
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {progress.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-primary-100">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-1000 ease-out"
              ></div>
            </div>
            <p className="text-sm text-slate-500 text-center">
              順調です！目標の{settings.targetHours}時間達成に向けて頑張りましょう。
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
        >
          <StatCard
            icon={<Target className="text-blue-500" />}
            label="1日の目標"
            // リアルタイムで変化する hh時間mm分ss秒 表示にする
            value={formatTimeJapanese(realtimeDailyGoal)}
            subtext="期限まで"
            color="bg-blue-50"
          />
          <StatCard
            icon={<Clock className="text-emerald-500" />}
            label="今日の学習"
            value={formatTimeJapanese(todayStudiedHours)}
            subtext="今日の合計"
            color="bg-emerald-50"
          />
          <StatCard
            icon={<TrendingUp className="text-violet-500" />}
            label="総学習時間"
            value={formatTimeJapanese(totalStudiedHours)}
            subtext={`目標 ${settings.targetHours}時間`}
            color="bg-violet-50"
          />
          <StatCard
            icon={<Calendar className="text-amber-500" />}
            label="残り時間"
            // 表示は正式な残り時間のみ（秒単位で計算した正確な表示）
            value={formatCountdownJapanese(timeRemainingSeconds)}
            subtext=""
            color="bg-amber-50"
          />
        </motion.div>
      </div>

      {/* Fullscreen Timer */}
      <AnimatePresence mode="wait">
        {fullscreenTimer && (
          <Timer key="timer-overlay" fullscreen={true} onClose={() => setFullscreenTimer(false)} />
        )}
      </AnimatePresence>
    </>
  );
};


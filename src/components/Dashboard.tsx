import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { Target, Calendar, Clock, TrendingUp, Maximize2 } from 'lucide-react';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';

export const Dashboard: React.FC = () => {
  const { 
    totalStudiedHours, 
    daysRemaining, 
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
  const realtimeDailyGoal = hoursUntilEnd > 0 ? remainingHoursToStudy / hoursUntilEnd * 24 : 0;

  return (
    <>
      <div className="space-y-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">ダッシュボード</h2>
          <p className="text-slate-500 mt-2">進捗を確認して、集中力を維持しましょう。</p>
        </header>

        {/* Timer Button at Top */}
        <button
          onClick={() => setFullscreenTimer(true)}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-6 rounded-2xl shadow-xl shadow-primary-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
        >
          <Maximize2 size={24} />
          計測開始
        </button>

        {/* Progress Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Target className="text-blue-500" />}
            label="1日の目標"
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
            value={`${daysRemaining}日`}
            subtext={formatCountdownJapanese(timeRemainingSeconds)}
            color="bg-amber-50"
          />
        </div>
      </div>

      {/* Fullscreen Timer */}
      {fullscreenTimer && (
        <Timer fullscreen={true} onClose={() => setFullscreenTimer(false)} />
      )}
    </>
  );
};

const StatCard = ({ icon, label, value, subtext, color }: { icon: React.ReactNode, label: string, value: string, subtext: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
    <p className="text-xs text-slate-400 mt-1">{subtext}</p>
  </div>
);

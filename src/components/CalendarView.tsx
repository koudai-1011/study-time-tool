import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  isSameDay, 
  addMonths, 
  subMonths, 
  parseISO,
  startOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { DayDetailModal } from './DayDetailModal';

export const CalendarView: React.FC = () => {
  const { logs, settings } = useStudy();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const getStudyTimeForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayLogs = logs.filter(log => isSameDay(parseISO(log.date), dayStart));
    const totalSeconds = dayLogs.reduce((acc, log) => acc + log.duration, 0);
    return totalSeconds / 3600;
  };

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // カレンダーのグリッド（前月の末尾の日も含む）
  const calendarDays: Array<{ date: number; isCurrentMonth: boolean; dateObj: Date }> = [];
  
  // 前月の日付
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    calendarDays.push({ date: day, isCurrentMonth: false, dateObj: new Date(year, month - 1, day) });
  }
  
  // 今月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ date: day, isCurrentMonth: true, dateObj: new Date(year, month, day) });
  }
  
  // 次月の日付（7の倍数になるまで）
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({ date: day, isCurrentMonth: false, dateObj: new Date(year, month + 1, day) });
    }
  }

  const today = new Date();

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
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
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
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
          {calendarDays.map(({ date, isCurrentMonth, dateObj }, index) => {
            const hours = getStudyTimeForDay(dateObj);
            const hasStudy = hours > 0;
            const isToday = isSameDay(dateObj, today);
            const dayOfWeek = index % 7;
            const dayLogs = logs.filter(log => isSameDay(parseISO(log.date), dateObj));
            const categoryColors = [...new Set(dayLogs.map(log => {
              const category = settings.categories.find(c => c.id === log.categoryId);
              return category?.color;
            }))].filter(Boolean).slice(0, 4);

            return (
              <motion.button 
                key={index}
                onClick={() => setSelectedDate(dateObj.toISOString())}
                disabled={!isCurrentMonth}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all ${
                  isCurrentMonth
                    ? hasStudy
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-30'
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                whileHover={isCurrentMonth ? { scale: 1.05 } : {}}
                whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
              >
                <span className={`text-sm font-medium ${
                  isToday
                    ? 'text-primary-600 dark:text-primary-400 font-bold'
                    : isCurrentMonth
                    ? dayOfWeek === 0
                      ? 'text-red-600 dark:text-red-400'
                      : dayOfWeek === 6
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-200'
                    : 'text-slate-400'
                }`}>
                  {date}
                </span>

                {hasStudy && isCurrentMonth && (
                  <div className="flex flex-col items-center gap-0.5 mt-auto mb-1">
                    <span className="text-[9px] md:text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                      {(() => {
                        const h = Math.floor(hours);
                        const m = Math.round((hours - h) * 60);
                        if (h > 0 && m > 0) return `${h}h${m}`;
                        if (h > 0) return `${h}h`;
                        return `${m}m`;
                      })()}
                    </span>
                    {categoryColors.length > 0 && (
                      <div className="flex gap-0.5">
                        {categoryColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color as string }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

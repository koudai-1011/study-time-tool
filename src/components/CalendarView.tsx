import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  parseISO,
  startOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { clsx } from 'clsx';
import { formatTimeJapanese } from '../utils/timeFormat';

export const CalendarView: React.FC = () => {
  const { logs } = useStudy();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getStudyTimeForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayLogs = logs.filter(log => isSameDay(parseISO(log.date), dayStart));
    const totalSeconds = dayLogs.reduce((acc, log) => acc + log.duration, 0);
    return totalSeconds / 3600;
  };

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">学習履歴</h2>
        <p className="text-slate-500">日々の学習履歴を確認できます。</p>
        
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="text-slate-600" />
          </button>
          <h3 className="text-xl font-bold text-slate-700">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="text-slate-600" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8">
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="text-center text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {/* Padding for start of month */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map(day => {
            const hours = getStudyTimeForDay(day);
            const hasStudy = hours > 0;
            const intensity = Math.min(1, hours / 4); // Cap intensity at 4 hours for visual scaling

            return (
              <div 
                key={day.toISOString()}
                className={clsx(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all hover:scale-105",
                  hasStudy ? "bg-primary-50 border-primary-100" : "bg-slate-50 border-slate-100 hover:bg-slate-100",
                  "border"
                )}
              >
                <span className={clsx(
                  "text-sm font-medium mb-1",
                  isSameDay(day, new Date()) ? "bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md" : "text-slate-600"
                )}>
                  {format(day, 'd')}
                </span>
                
                {hasStudy && (
                  <>
                    <span className="text-xs font-bold text-primary-600">
                      {formatTimeJapanese(hours)}
                    </span>
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-2xl opacity-50"
                      style={{ opacity: 0.2 + (intensity * 0.8) }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

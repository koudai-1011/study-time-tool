import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { formatTimeJapanese } from '../utils/timeFormat';
import { DayDetailModal } from './DayDetailModal';

export const CalendarView: React.FC = () => {
  const { logs, settings } = useStudy();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

          {daysInMonth.map((day, dayIndex) => {
            const hours = getStudyTimeForDay(day);
            const hasStudy = hours > 0;
            const intensity = Math.min(1, hours / 4);
            const isToday = isSameDay(day, new Date());
            const dayLogs = logs.filter(log => isSameDay(parseISO(log.date), day));
            const categoryColors = [...new Set(dayLogs.map(log => {
              const category = settings.categories.find(c => c.id === log.categoryId);
              return category?.color;
            }))].filter(Boolean);

            return (
              <motion.button 
                key={day.toISOString()}
                onClick={() => setSelectedDate(day.toISOString())}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all border ${
                  hasStudy ? 'bg-primary-50 border-primary-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: dayIndex * 0.01,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
              >
                <span className={`text-sm font-medium mb-1 ${
                  isToday ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md' : 'text-slate-600'
                }`}>
                  {format(day, 'd')}
                </span>

                {hasStudy && (
                  <>
                    <span className="text-[10px] md:text-xs font-bold text-primary-600 truncate w-full text-center px-0.5">
                      {formatTimeJapanese(hours)}
                    </span>
                    {categoryColors.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {categoryColors.slice(0, 3).map((color, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color as string }}
                          />
                        ))}
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-2xl"
                      style={{ opacity: 0.2 + (intensity * 0.8) }}
                    />
                  </>
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

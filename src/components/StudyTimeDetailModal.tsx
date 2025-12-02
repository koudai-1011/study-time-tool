import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useStudy } from '../context/StudyContext';
import { formatTimeJapanese } from '../utils/timeFormat';

interface StudyTimeDetailModalProps {
  onClose: () => void;
}

export const StudyTimeDetailModal: React.FC<StudyTimeDetailModalProps> = ({ onClose }) => {
  const { logs, settings, setIsSwipeEnabled } = useStudy();

  // Disable swipe when modal is open
  useEffect(() => {
    setIsSwipeEnabled(false);
    return () => setIsSwipeEnabled(true);
  }, [setIsSwipeEnabled]);

  // Generate data based on settings or default to last 30 days
  const today = startOfDay(new Date());
  let startDate = subDays(today, 29);
  let endDate = today;

  if (settings.startDate && settings.endDate) {
    startDate = startOfDay(parseISO(settings.startDate));
    endDate = startOfDay(parseISO(settings.endDate));
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const data = days.map((day, index) => {
    const dailySeconds = logs
      .filter(log => isSameDay(parseISO(log.date), day))
      .reduce((acc, log) => acc + log.duration, 0);
    
    const dailyHours = dailySeconds / 3600;

    return {
      date: format(day, 'M/d', { locale: ja }),
      fullDate: format(day, 'yyyy年M月d日', { locale: ja }),
      hours: parseFloat(dailyHours.toFixed(1)),
      rawSeconds: dailySeconds,
    };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">学習時間の推移</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">過去30日間の日別学習時間</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  unit="h"
                />
                <Tooltip
                  cursor={{ fill: settings.isDarkMode ? '#334155' : '#f1f5f9' }}
                  contentStyle={{
                    backgroundColor: settings.isDarkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: settings.isDarkMode ? '1px solid #334155' : 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                    color: settings.isDarkMode ? '#f1f5f9' : '#1e293b'
                  }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => {
                    return [formatTimeJapanese(value), '学習時間'];
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.rawSeconds > 0 ? '#00afcc' : '#e2e8f0'} 
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

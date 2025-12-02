import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useStudy } from '../context/StudyContext';

interface ProgressDetailModalProps {
  onClose: () => void;
}

export const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({ onClose }) => {
  const { logs, settings } = useStudy();

  // Generate data based on settings or default to last 30 days
  const today = startOfDay(new Date());
  let startDate = subDays(today, 29);
  let endDate = today;

  if (settings.startDate && settings.endDate) {
    startDate = startOfDay(parseISO(settings.startDate));
    endDate = startOfDay(parseISO(settings.endDate));
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const data = days.map(day => {
    // Calculate cumulative study time up to this day
    const cumulativeSeconds = logs
      .filter(log => {
        const logDate = parseISO(log.date);
        return logDate <= day; // Include logs up to the end of this day
      })
      .reduce((acc, log) => acc + log.duration, 0);

    const cumulativeHours = cumulativeSeconds / 3600;
    const progress = Math.min(100, (cumulativeHours / settings.targetHours) * 100);

    return {
      date: format(day, 'M/d', { locale: ja }),
      fullDate: format(day, 'yyyy年M月d日', { locale: ja }),
      progress: parseFloat(progress.toFixed(1)),
      hours: parseFloat(cumulativeHours.toFixed(1)),
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
          className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">進捗率の推移</h2>
                <p className="text-sm text-slate-500">過去30日間の目標達成度</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                  formatter={(value: number) => [`${value}%`, '進捗率']}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProgress)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

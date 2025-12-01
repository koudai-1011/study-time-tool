import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useStudy } from '../context/StudyContext';
import { formatTimeJapanese } from '../utils/timeFormat';

export const CategoryChart: React.FC = () => {
  const { logs, settings, totalStudiedHours } = useStudy();

  const data = useMemo(() => {
    // 1. Aggregate duration by category
    const categoryDurations = new Map<number, number>();
    logs.forEach(log => {
      const current = categoryDurations.get(log.categoryId) || 0;
      categoryDurations.set(log.categoryId, current + log.duration);
    });

    // 2. Create data for chart
    const chartData = settings.categories.map(category => ({
      name: category.name,
      value: categoryDurations.get(category.id) || 0,
      color: category.color,
    })).filter(item => item.value > 0); // Only show categories with data

    // 3. Add "Remaining" slice if target is set
    if (settings.targetHours > 0) {
      const targetSeconds = settings.targetHours * 3600;
      const totalStudiedSeconds = totalStudiedHours * 3600;
      const remainingSeconds = Math.max(0, targetSeconds - totalStudiedSeconds);

      if (remainingSeconds > 0) {
        chartData.push({
          name: '残り',
          value: remainingSeconds,
          color: '#f1f5f9', // slate-100
        });
      }
    }

    return chartData;
  }, [logs, settings, totalStudiedHours]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-700">{data.name}</p>
          <p className="text-slate-500">
            {formatTimeJapanese(data.value / 3600)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0 || (data.length === 1 && data[0].name === '残り')) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-slate-400">学習データがまだありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-6">学習時間の内訳</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => (
                <span className="text-slate-600 text-sm ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { useStudy } from '../context/StudyContext';

export const CategoryChart: React.FC = () => {
  const { logs, settings, totalStudiedHours } = useStudy();
  const [activeIndex, setActiveIndex] = React.useState(0);

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

    // 4. Sort by value descending
    return chartData.sort((a, b) => b.value - a.value);
  }, [logs, settings, totalStudiedHours]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={settings.isDarkMode ? '#e2e8f0' : '#334155'} className="text-sm font-bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={15} textAnchor="middle" fill={settings.isDarkMode ? '#94a3b8' : '#64748b'} className="text-xs">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 12}
          fill={fill}
        />
      </g>
    );
  };

  if (data.length === 0 || (data.length === 1 && data[0].name === '残り')) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-slate-400 dark:text-slate-500">学習データがまだありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">学習時間の内訳</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              // @ts-ignore
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onMouseEnter={onPieEnter}
              onClick={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              onClick={(props) => {
                const index = data.findIndex(item => item.name === props.value);
                setActiveIndex(index);
              }}
              formatter={(value, _entry: any) => {
                const item = data.find(d => d.name === value);
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const percent = item ? (item.value / total * 100).toFixed(1) : 0;
                const isActive = data[activeIndex]?.name === value;
                
                return (
                  <span className={`text-sm ml-1 cursor-pointer transition-colors ${
                    isActive 
                      ? 'text-slate-900 dark:text-slate-100 font-bold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {value} ({percent}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

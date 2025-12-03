import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
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
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">学習時間の内訳</h3>
      <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
        {/* Chart Area */}
        <div className="w-full md:w-1/2 h-[250px] relative">
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
                outerRadius={80}
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend Area */}
        <div className="w-full md:w-1/2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-2">
            {data.map((entry, index) => {
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percent = (entry.value / total * 100).toFixed(1);
              const isActive = index === activeIndex;

              return (
                <div 
                  key={entry.name}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-slate-700' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className={`text-sm ${
                      isActive 
                        ? 'font-bold text-slate-900 dark:text-slate-100' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

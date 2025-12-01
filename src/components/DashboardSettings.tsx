import React from 'react';
import { useStudy } from '../context/StudyContext';
import type { DashboardWidgetType } from '../types';
import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

const WIDGET_LABELS: Record<DashboardWidgetType, string> = {
  progress: '全体の進捗',
  daily_goal: '1日の目標',
  today_study: '今日の学習',
  total_study: '総学習時間',
  remaining_time: '残り時間',
  category_chart: '学習時間の内訳（円グラフ）',
};

export const DashboardSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  const layout = settings.dashboardLayout || {
    widgets: [
      { id: 'progress', visible: true, order: 0 },
      { id: 'daily_goal', visible: true, order: 1 },
      { id: 'today_study', visible: true, order: 2 },
      { id: 'total_study', visible: true, order: 3 },
      { id: 'remaining_time', visible: true, order: 4 },
      { id: 'category_chart', visible: true, order: 5 },
    ]
  };

  const handleToggleVisibility = (id: DashboardWidgetType) => {
    const newWidgets = layout.widgets.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: newWidgets }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...layout.widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[index - 1];
    newWidgets[index - 1] = temp;
    
    // Update order property
    newWidgets.forEach((w, i) => w.order = i);

    updateSettings({
      ...settings,
      dashboardLayout: { widgets: newWidgets }
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === layout.widgets.length - 1) return;
    const newWidgets = [...layout.widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[index + 1];
    newWidgets[index + 1] = temp;

    // Update order property
    newWidgets.forEach((w, i) => w.order = i);

    updateSettings({
      ...settings,
      dashboardLayout: { widgets: newWidgets }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">ダッシュボード設定</h3>
      <p className="text-sm text-slate-500 mb-4">
        ダッシュボードに表示する項目の選択と並び替えができます。
      </p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {layout.widgets.map((widget, index) => (
          <div 
            key={widget.id}
            className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 ${
              !widget.visible ? 'bg-slate-50 opacity-75' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleVisibility(widget.id)}
                className={`p-2 rounded-lg transition-colors ${
                  widget.visible 
                    ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
                title={widget.visible ? '非表示にする' : '表示する'}
              >
                {widget.visible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <span className={`font-medium ${widget.visible ? 'text-slate-700' : 'text-slate-500'}`}>
                {WIDGET_LABELS[widget.id]}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="上へ移動"
              >
                <ArrowUp size={20} />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === layout.widgets.length - 1}
                className="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="下へ移動"
              >
                <ArrowDown size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { useStudy } from '../context/StudyContext';
import type { DashboardWidgetType, DashboardWidget, DashboardWidgetSize } from '../types';
import { Eye, EyeOff, GripVertical, Maximize2, Square, RectangleHorizontal } from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const WIDGET_LABELS: Record<DashboardWidgetType, string> = {
  start_timer: '計測開始ボタン',
  pomodoro_timer: '🍅 ポモドーロ',
  progress: '全体の進捗',
  daily_goal: '1日の目標',
  today_study: '今日の学習時間',
  total_study: '総学習時間',
  remaining_time: '残り時間',
  category_chart: '学習カテゴリ比率',
  today_review: '本日の復習',
  sabotage: 'サボりモード',
};

const SIZE_OPTIONS: { value: DashboardWidgetSize; icon: React.ReactNode; label: string }[] = [
  { value: 'small', icon: <Square size={14} />, label: '小' },
  { value: 'large', icon: <RectangleHorizontal size={14} />, label: '大' },
  { value: 'full', icon: <Maximize2 size={14} />, label: '全幅' },
];

interface SortableItemProps {
  widget: DashboardWidget;
  onToggle: (id: DashboardWidgetType) => void;
  onSizeChange: (id: DashboardWidgetType, size: DashboardWidgetSize) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ widget, onToggle, onSizeChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 bg-white dark:bg-slate-800 ${
        !widget.visible ? 'bg-slate-50 dark:bg-slate-700/50 opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={() => onToggle(widget.id)}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            widget.visible 
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}
          title={widget.visible ? '非表示にする' : '表示する'}
        >
          {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <span className={`text-sm font-medium truncate ${widget.visible ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
          {WIDGET_LABELS[widget.id]}
        </span>
      </div>

      {/* サイズ選択 */}
      <div className="flex items-center gap-1 mr-2">
        {SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSizeChange(widget.id, option.value)}
            className={`p-1.5 rounded transition-colors ${
              widget.size === option.value
                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>

      <div 
        {...attributes} 
        {...listeners} 
        className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-grab active:cursor-grabbing touch-none"
        title="ドラッグして並び替え"
      >
        <GripVertical size={18} />
      </div>
    </div>
  );
};

export const DashboardSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  const reviewEnabled = settings.reviewSettings?.enabled || false;
  
  const defaultWidgets: DashboardWidget[] = [
    { id: 'start_timer', visible: true, order: 0, size: 'full' },
    { id: 'pomodoro_timer', visible: true, order: 1, size: 'full' },
    { id: 'progress', visible: true, order: 2, size: 'large' },
    { id: 'daily_goal', visible: true, order: 3, size: 'small' },
    { id: 'today_study', visible: true, order: 4, size: 'small' },
    { id: 'total_study', visible: true, order: 5, size: 'small' },
    { id: 'remaining_time', visible: true, order: 6, size: 'small' },
    { id: 'category_chart', visible: true, order: 7, size: 'large' },
    ...(reviewEnabled ? [{ id: 'today_review' as const, visible: true, order: 8, size: 'large' as const }] : []),
  ];

  // Merge saved layout with defaults
  const layout = {
    widgets: defaultWidgets.map(defaultWidget => {
      const savedWidget = settings.dashboardLayout?.widgets.find(w => w.id === defaultWidget.id);
      return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
    }).sort((a, b) => a.order - b.order)
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = layout.widgets.findIndex(w => w.id === active.id);
      const newIndex = layout.widgets.findIndex(w => w.id === over.id);
      
      const newWidgets = arrayMove(layout.widgets, oldIndex, newIndex);
      newWidgets.forEach((w, i) => w.order = i);

      updateSettings({
        ...settings,
        dashboardLayout: { widgets: newWidgets }
      });
    }
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

  const handleSizeChange = (id: DashboardWidgetType, size: DashboardWidgetSize) => {
    const newWidgets = layout.widgets.map(w => 
      w.id === id ? { ...w, size } : w
    );
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: newWidgets }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        ウィジェットの表示/非表示、サイズ、並び順を設定できます。
      </p>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={layout.widgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {layout.widgets.map((widget) => (
              <SortableItem 
                key={widget.id} 
                widget={widget} 
                onToggle={handleToggleVisibility}
                onSizeChange={handleSizeChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">目標ライン表示</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">進捗グラフに目標ラインを表示</p>
        </div>
        <button
          onClick={() => {
            updateSettings({
              ...settings,
              showDailyGoalLine: !settings.showDailyGoalLine
            });
          }}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            settings.showDailyGoalLine ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.showDailyGoalLine ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

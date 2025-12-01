import React from 'react';
import { useStudy } from '../context/StudyContext';
import type { DashboardWidgetType, DashboardWidget } from '../types';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
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
  progress: '全体の進捗',
  daily_goal: '1日の目標',
  today_study: '今日の学習',
  total_study: '総学習時間',
  remaining_time: '残り時間',
  category_chart: '学習時間の内訳（円グラフ）',
};

interface SortableItemProps {
  widget: DashboardWidget;
  onToggle: (id: DashboardWidgetType) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ widget, onToggle }) => {
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
      className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 bg-white ${
        !widget.visible ? 'bg-slate-50 opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(widget.id)}
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

      <div 
        {...attributes} 
        {...listeners} 
        className="p-3 text-slate-400 hover:text-primary-600 cursor-grab active:cursor-grabbing touch-none"
        title="ドラッグして並び替え（長押し）"
      >
        <GripVertical size={20} />
      </div>
    </div>
  );
};

export const DashboardSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  const layout = settings.dashboardLayout || {
    widgets: [
      { id: 'start_timer', visible: true, order: 0 },
      { id: 'progress', visible: true, order: 1 },
      { id: 'daily_goal', visible: true, order: 2 },
      { id: 'today_study', visible: true, order: 3 },
      { id: 'total_study', visible: true, order: 4 },
      { id: 'remaining_time', visible: true, order: 5 },
      { id: 'category_chart', visible: true, order: 6 },
    ]
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
      
      // Update order property
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">ダッシュボード設定</h3>
      <p className="text-sm text-slate-500 mb-4">
        ダッシュボードに表示する項目の選択と並び替えができます。
        <br />
        <span className="text-xs text-slate-400">※並び替えは右側のアイコンをドラッグ（スマホは長押し）してください</span>
      </p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={layout.widgets.map(w => w.id)} 
            strategy={verticalListSortingStrategy}
          >
            {layout.widgets.map((widget) => (
              <SortableItem 
                key={widget.id} 
                widget={widget} 
                onToggle={handleToggleVisibility} 
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

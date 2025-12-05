import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2, Pencil, Check, Eye, EyeOff, Square, RectangleHorizontal } from 'lucide-react';
import type { DashboardWidget, DashboardWidgetSize, DashboardWidgetType } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { StatCard } from './StatCard';
import { CategoryChart } from './CategoryChart';
import { TodayReviewWidget } from './TodayReviewWidget';

import { SabotageModal } from './SabotageModal';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

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
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// サイズに応じたグリッドクラスを返す
const getSizeClass = (size: DashboardWidgetSize): string => {
  switch (size) {
    case 'small':
      return 'col-span-1';
    case 'medium':
      return 'col-span-1 row-span-2';
    case 'large':
      return 'col-span-2';
    case 'full':
      return 'col-span-2';
    default:
      return 'col-span-1';
  }
};

// ウィジェット名のマッピング
const WIDGET_NAMES: Record<DashboardWidgetType, string> = {
  start_timer: '計測開始',
  pomodoro_timer: 'ポモドーロ',
  progress: '進捗',
  daily_goal: '1日の目標',
  today_study: '今日の学習',
  total_study: '総学習時間',
  remaining_time: '残り時間',
  category_chart: '円グラフ',
  today_review: '復習',
};

// ソータブルウィジェットコンポーネント
interface SortableWidgetProps {
  widget: DashboardWidget;
  isEditMode: boolean;
  onSizeChange: (id: DashboardWidgetType, size: DashboardWidgetSize) => void;
  onVisibilityChange: (id: DashboardWidgetType) => void;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  widget,
  isEditMode,
  onSizeChange,
  onVisibilityChange,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const sizeClass = getSizeClass(widget.size);

  if (!isEditMode) {
    return <div className={sizeClass}>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClass} relative ${isDragging ? 'opacity-90 scale-105' : ''}`}
    >
      {/* ウィジェット本体（薄く表示） */}
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>
      
      {/* 編集オーバーレイ */}
      <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary-400 bg-primary-500/5 flex flex-col">
        {/* ドラッグハンドル（上部） */}
        <div 
          className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
            <span className="text-primary-700 dark:text-primary-300 text-xs font-bold">
              ⋮⋮ {WIDGET_NAMES[widget.id]}
            </span>
          </div>
        </div>
        
        {/* コントロールボタン（下部） */}
        <div className="flex gap-2 justify-center pb-3">
          <button
            onClick={() => onSizeChange(widget.id, 'small')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
              widget.size === 'small' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}
            title="小サイズ"
          >
            <Square size={14} />
          </button>
          
          <button
            onClick={() => onSizeChange(widget.id, 'large')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
              widget.size === 'large' || widget.size === 'full'
                ? 'bg-primary-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}
            title="大サイズ"
          >
            <RectangleHorizontal size={14} />
          </button>

          <button
            onClick={() => onVisibilityChange(widget.id)}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm"
            title="非表示にする"
          >
            <EyeOff size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const {
    totalStudiedHours,
    todayStudiedHours,
    settings,
    updateSettings,
    timeRemainingSeconds
  } = useStudy();

  const progress = settings.targetHours > 0
    ? Math.min(100, (totalStudiedHours / settings.targetHours) * 100)
    : 0;

  const [fullscreenTimer, setFullscreenTimer] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showStudyTimeModal, setShowStudyTimeModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);

  // Update current time every second for real-time daily goal calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate daily goal based on current time
  const now = currentTime;
  const endDateParsed = settings.endDate ? new Date(settings.endDate) : null;
  const timeUntilEnd = endDateParsed ? Math.max(0, endDateParsed.getTime() - now.getTime()) : 0;
  const hoursUntilEnd = timeUntilEnd / (1000 * 60 * 60);
  const remainingHoursToStudy = Math.max(0, settings.targetHours - totalStudiedHours);
  const realtimeDailyGoal = hoursUntilEnd > 0 ? (remainingHoursToStudy / hoursUntilEnd) * 24 : 0;

  // Default widgets definition with size
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

  // Merge saved layout with default widgets
  const layout = {
    widgets: defaultWidgets.map(defaultWidget => {
      const savedWidget = settings.dashboardLayout?.widgets.find(w => w.id === defaultWidget.id);
      return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
    }).sort((a, b) => a.order - b.order)
  };

  // dnd-kit sensors - ドラッグ開始の距離制限を設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const visibleWidgets = layout.widgets.filter(w => w.visible);
      const oldIndex = visibleWidgets.findIndex(w => w.id === active.id);
      const newIndex = visibleWidgets.findIndex(w => w.id === over.id);
      
      const newVisibleWidgets = arrayMove(visibleWidgets, oldIndex, newIndex);
      
      // Update order for all widgets
      const hiddenWidgets = layout.widgets.filter(w => !w.visible);
      const allWidgets = [...newVisibleWidgets, ...hiddenWidgets].map((w, i) => ({ ...w, order: i }));
      
      updateSettings({
        ...settings,
        dashboardLayout: { widgets: allWidgets }
      });
    }
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

  const handleVisibilityChange = (id: DashboardWidgetType) => {
    const newWidgets = layout.widgets.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: newWidgets }
    });
  };

  // ウィジェットをレンダリング（内部コンテンツのみ）
  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.id) {
      case 'start_timer':
        return (
          <motion.button
            onClick={() => !isEditMode && setFullscreenTimer(true)}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <Maximize2 size={20} />
            計測開始
          </motion.button>
        );

      case 'pomodoro_timer':
        return (
          <motion.button
            onClick={() => !isEditMode && setShowPomodoroTimer(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <Clock size={20} />
            ポモドーロ
          </motion.button>
        );

      case 'progress':
        return (
          <motion.div
            className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
            onClick={() => !isEditMode && setShowProgressModal(true)}
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">全体の進捗</span>
              </div>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{progress.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              あと{Math.max(0, settings.targetHours - totalStudiedHours).toFixed(1)}時間
            </p>
          </motion.div>
        );

      case 'daily_goal':
        return (
          <StatCard
            icon={<Calendar className="text-blue-500" size={20} />}
            label="1日の目標"
            value={formatTimeJapanese(realtimeDailyGoal)}
            subtext="目標期限から算出"
            color="bg-blue-50 dark:bg-blue-900/20"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
            compact
          />
        );

      case 'today_study':
        return (
          <StatCard
            icon={<Clock className="text-green-500" size={20} />}
            label="今日の学習"
            value={formatTimeJapanese(todayStudiedHours)}
            subtext={todayStudiedHours >= realtimeDailyGoal ? "目標達成！" : `あと${Math.max(0, realtimeDailyGoal - todayStudiedHours).toFixed(1)}h`}
            color="bg-green-50 dark:bg-green-900/20"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
            compact
          />
        );

      case 'total_study':
        return (
          <StatCard
            icon={<TrendingUp className="text-purple-500" size={20} />}
            label="総学習時間"
            value={formatTimeJapanese(totalStudiedHours)}
            subtext="積み上げ中"
            color="bg-purple-50 dark:bg-purple-900/20"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
            compact
          />
        );

      case 'remaining_time':
        return (
          <StatCard
            icon={<Clock className="text-orange-500" size={20} />}
            label="残り時間"
            value={formatCountdownJapanese(timeRemainingSeconds)}
            subtext={settings.endDate ? `期限: ${settings.endDate}` : '期限なし'}
            color="bg-orange-50 dark:bg-orange-900/20"
            compact
          />
        );

      case 'category_chart':
        return <CategoryChart />;

      case 'today_review':
        return <TodayReviewWidget />;

      default:
        return null;
    }
  };

  const visibleWidgets = layout.widgets.filter(w => w.visible);
  const hiddenWidgets = layout.widgets.filter(w => !w.visible);

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ダッシュボード</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        
        {/* 編集ボタン */}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`p-2 rounded-xl transition-colors ${
            isEditMode 
              ? 'bg-primary-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {isEditMode ? <Check size={20} /> : <Pencil size={20} />}
        </button>
      </header>

      {/* 編集モード時のヘルプ */}
      {isEditMode && (
        <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs p-3 rounded-xl text-center">
          ドラッグで並び替え • サイズ変更 • 非表示
        </div>
      )}

      {/* ウィジェットグリッド */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className={`grid grid-cols-2 gap-3 ${isEditMode ? 'p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600' : ''}`}>
            {/* 編集モード時のガイドライン表示 */}
            {isEditMode && (
              <div className="col-span-2 text-center text-xs text-slate-400 dark:text-slate-500 py-1">
                📦 ウィジェット名をドラッグして並び替え
              </div>
            )}
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onSizeChange={handleSizeChange}
                onVisibilityChange={handleVisibilityChange}
              >
                {renderWidgetContent(widget)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 非表示ウィジェット一覧（編集モード時のみ） */}
      {isEditMode && hiddenWidgets.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">非表示のウィジェット</p>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => handleVisibilityChange(widget.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs"
              >
                <Eye size={12} />
                {WIDGET_NAMES[widget.id]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {fullscreenTimer && (
          <Timer fullscreen onClose={() => setFullscreenTimer(false)} />
        )}
        {showPomodoroTimer && (
          <PomodoroTimer onClose={() => setShowPomodoroTimer(false)} />
        )}
        {showSabotageModal && (
          <SabotageModal 
            dailyGoalHours={realtimeDailyGoal} 
            onClose={() => setShowSabotageModal(false)} 
          />
        )}
        {showProgressModal && (
          <ProgressDetailModal onClose={() => setShowProgressModal(false)} />
        )}
        {showStudyTimeModal && (
          <StudyTimeDetailModal onClose={() => setShowStudyTimeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

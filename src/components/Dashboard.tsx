import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2, Pencil, Check, Eye, Square, RectangleHorizontal, GripVertical, Trash2 } from 'lucide-react';
import type { DashboardWidget, DashboardWidgetSize, DashboardWidgetType } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { StatCard } from './StatCard';
import { CategoryChart } from './CategoryChart';
import { TodayReviewWidget } from './TodayReviewWidget';

import { SabotageModal } from './SabotageModal';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

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
  start_timer: '計測',
  pomodoro_timer: 'ポモドーロ',
  progress: '進捗',
  daily_goal: '目標',
  today_study: '今日',
  total_study: '総計',
  remaining_time: '残り',
  category_chart: 'グラフ',
  today_review: '復習',
};

// ウィジェットアイコンのマッピング
const WIDGET_ICONS: Record<DashboardWidgetType, React.ReactNode> = {
  start_timer: <Maximize2 size={16} />,
  pomodoro_timer: <Clock size={16} />,
  progress: <Target size={16} />,
  daily_goal: <Calendar size={16} />,
  today_study: <Clock size={16} />,
  total_study: <TrendingUp size={16} />,
  remaining_time: <Clock size={16} />,
  category_chart: <Target size={16} />,
  today_review: <Eye size={16} />,
};

// 編集モードのグリッドスロット
interface GridSlotProps {
  index: number;
  widget: DashboardWidget | null;
  isDropTarget: boolean;
  onRemove: (id: DashboardWidgetType) => void;
  onDrop: (index: number) => void;
  onDragOver: (index: number) => void;
}

const GridSlot: React.FC<GridSlotProps> = ({ index, widget, isDropTarget, onRemove, onDrop, onDragOver }) => {
  const baseClass = "min-h-[60px] rounded-xl border-2 transition-all flex items-center justify-center";
  
  if (widget) {
    const sizeClass = widget.size === 'large' || widget.size === 'full' ? 'col-span-2' : 'col-span-1';
    return (
      <div 
        className={`${sizeClass} ${baseClass} border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20`}
        onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
        onDrop={() => onDrop(index)}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <GripVertical size={14} className="text-primary-400" />
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {WIDGET_NAMES[widget.id]}
          </span>
          <span className="text-xs text-primary-500 dark:text-primary-400">
            ({widget.size === 'small' ? '小' : '大'})
          </span>
          <button
            onClick={() => onRemove(widget.id)}
            className="ml-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${baseClass} ${isDropTarget 
        ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30 border-solid' 
        : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
    >
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {isDropTarget ? 'ここにドロップ' : '空きスロット'}
      </span>
    </div>
  );
};

// ウィジェットパレットアイテム
interface PaletteItemProps {
  widgetId: DashboardWidgetType;
  isUsed: boolean;
  selectedSize: DashboardWidgetSize;
  onDragStart: (id: DashboardWidgetType) => void;
  onDragEnd: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ widgetId, isUsed, selectedSize, onDragStart, onDragEnd }) => {
  return (
    <div
      draggable={!isUsed}
      onDragStart={() => onDragStart(widgetId)}
      onDragEnd={onDragEnd}
      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
        isUsed 
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
          : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 cursor-grab active:cursor-grabbing hover:scale-105'
      }`}
    >
      {WIDGET_ICONS[widgetId]}
      <span className="text-[10px] font-medium whitespace-nowrap">{WIDGET_NAMES[widgetId]}</span>
      {!isUsed && (
        <span className="text-[8px] text-primary-500">{selectedSize === 'small' ? '小' : '大'}</span>
      )}
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
  
  // テトリス風編集の状態
  const [selectedSize, setSelectedSize] = useState<DashboardWidgetSize>('small');
  const [draggingWidget, setDraggingWidget] = useState<DashboardWidgetType | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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
  const allWidgetIds: DashboardWidgetType[] = [
    'start_timer', 'pomodoro_timer', 'progress', 'daily_goal', 
    'today_study', 'total_study', 'remaining_time', 'category_chart',
    ...(reviewEnabled ? ['today_review' as const] : []),
  ];

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

  const visibleWidgets = layout.widgets.filter(w => w.visible);
  const usedWidgetIds = visibleWidgets.map(w => w.id);

  // テトリス風編集のハンドラー
  const handlePaletteDragStart = (id: DashboardWidgetType) => {
    setDraggingWidget(id);
  };

  const handlePaletteDragEnd = () => {
    setDraggingWidget(null);
    setDropTargetIndex(null);
  };

  const handleGridDragOver = (index: number) => {
    setDropTargetIndex(index);
  };

  const handleGridDrop = (index: number) => {
    if (!draggingWidget) return;
    
    // 新しいウィジェットを追加
    const newWidget: DashboardWidget = {
      id: draggingWidget,
      visible: true,
      order: index,
      size: selectedSize,
    };
    
    // 既存のウィジェットの順序を更新
    const updatedWidgets = layout.widgets.map(w => {
      if (w.id === draggingWidget) {
        return { ...w, visible: true, order: index, size: selectedSize };
      }
      if (w.visible && w.order >= index) {
        return { ...w, order: w.order + 1 };
      }
      return w;
    });
    
    // 新規ウィジェットがない場合は追加
    if (!updatedWidgets.find(w => w.id === draggingWidget)) {
      updatedWidgets.push(newWidget);
    }
    
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: updatedWidgets.sort((a, b) => a.order - b.order) }
    });
    
    setDraggingWidget(null);
    setDropTargetIndex(null);
  };

  const handleRemoveWidget = (id: DashboardWidgetType) => {
    const updatedWidgets = layout.widgets.map(w => 
      w.id === id ? { ...w, visible: false } : w
    );
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: updatedWidgets }
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

  // 編集モードのUI
  if (isEditMode) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* ヘッダー */}
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">レイアウト編集</h2>
          <button
            onClick={() => setIsEditMode(false)}
            className="p-2 rounded-xl bg-primary-600 text-white"
          >
            <Check size={20} />
          </button>
        </header>

        {/* グリッドプレビュー */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
            下のパレットからウィジェットをドラッグして配置
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
            {visibleWidgets.map((widget, index) => (
              <GridSlot
                key={widget.id}
                index={index}
                widget={widget}
                isDropTarget={dropTargetIndex === index}
                onRemove={handleRemoveWidget}
                onDrop={handleGridDrop}
                onDragOver={handleGridDragOver}
              />
            ))}
            {/* 空きスロット（常に2つ表示） */}
            {[...Array(Math.max(0, 2 - (visibleWidgets.length % 2 === 0 ? 0 : 1)))].map((_, i) => (
              <GridSlot
                key={`empty-${i}`}
                index={visibleWidgets.length + i}
                widget={null}
                isDropTarget={dropTargetIndex === visibleWidgets.length + i}
                onRemove={() => {}}
                onDrop={handleGridDrop}
                onDragOver={handleGridDragOver}
              />
            ))}
          </div>
        </div>

        {/* サイズ選択 */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">サイズ:</span>
            <button
              onClick={() => setSelectedSize('small')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSize === 'small'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Square size={12} />
              小
            </button>
            <button
              onClick={() => setSelectedSize('large')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSize === 'large'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <RectangleHorizontal size={12} />
              大
            </button>
          </div>
        </div>

        {/* ウィジェットパレット */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 safe-area-pb">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 text-center">
            ウィジェットを長押しでドラッグ
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allWidgetIds.map((id) => (
              <PaletteItem
                key={id}
                widgetId={id}
                isUsed={usedWidgetIds.includes(id)}
                selectedSize={selectedSize}
                onDragStart={handlePaletteDragStart}
                onDragEnd={handlePaletteDragEnd}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 通常モードのUI
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
          onClick={() => setIsEditMode(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <Pencil size={20} />
        </button>
      </header>

      {/* ウィジェットグリッド */}
      <div className="grid grid-cols-2 gap-3">
        {visibleWidgets.map((widget) => (
          <div key={widget.id} className={getSizeClass(widget.size)}>
            {renderWidgetContent(widget)}
          </div>
        ))}
      </div>

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

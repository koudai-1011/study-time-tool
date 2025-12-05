import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2, Pencil, Check, Eye, Minus, Plus, Move } from 'lucide-react';
import type { DashboardWidget, DashboardWidgetType } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { CategoryChart } from './CategoryChart';
import { TodayReviewWidget } from './TodayReviewWidget';

import { SabotageModal } from './SabotageModal';
import { ProgressDetailModal } from './ProgressDetailModal';
import { StudyTimeDetailModal } from './StudyTimeDetailModal';

// グリッド設定
const GRID_COLS = 4;
const GRID_ROWS = 8;

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
  
  // 編集モードの状態
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidgetType | null>(null);
  const [editWidth, setEditWidth] = useState(2);
  const [editHeight, setEditHeight] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // 既存ウィジェットを編集中
  const [movingWidget, setMovingWidget] = useState<DashboardWidgetType | null>(null); // 移動中のウィジェット
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const now = currentTime;
  const endDateParsed = settings.endDate ? new Date(settings.endDate) : null;
  const timeUntilEnd = endDateParsed ? Math.max(0, endDateParsed.getTime() - now.getTime()) : 0;
  const hoursUntilEnd = timeUntilEnd / (1000 * 60 * 60);
  const remainingHoursToStudy = Math.max(0, settings.targetHours - totalStudiedHours);
  const realtimeDailyGoal = hoursUntilEnd > 0 ? (remainingHoursToStudy / hoursUntilEnd) * 24 : 0;

  const reviewEnabled = settings.reviewSettings?.enabled || false;
  const allWidgetIds: DashboardWidgetType[] = [
    'start_timer', 'pomodoro_timer', 'progress', 'daily_goal', 
    'today_study', 'total_study', 'remaining_time', 'category_chart',
    ...(reviewEnabled ? ['today_review' as const] : []),
  ];

  // デフォルトウィジェット
  const defaultWidgets: DashboardWidget[] = [
    { id: 'start_timer', visible: true, order: 0, size: 'large', width: 2, height: 1, gridX: 0, gridY: 0 },
    { id: 'pomodoro_timer', visible: true, order: 1, size: 'large', width: 2, height: 1, gridX: 2, gridY: 0 },
    { id: 'progress', visible: true, order: 2, size: 'large', width: 4, height: 1, gridX: 0, gridY: 1 },
    { id: 'daily_goal', visible: true, order: 3, size: 'small', width: 2, height: 1, gridX: 0, gridY: 2 },
    { id: 'today_study', visible: true, order: 4, size: 'small', width: 2, height: 1, gridX: 2, gridY: 2 },
    { id: 'total_study', visible: true, order: 5, size: 'small', width: 2, height: 1, gridX: 0, gridY: 3 },
    { id: 'remaining_time', visible: true, order: 6, size: 'small', width: 2, height: 1, gridX: 2, gridY: 3 },
    { id: 'category_chart', visible: true, order: 7, size: 'large', width: 4, height: 2, gridX: 0, gridY: 4 },
    ...(reviewEnabled ? [{ id: 'today_review' as const, visible: true, order: 8, size: 'large' as const, width: 4, height: 1, gridX: 0, gridY: 6 }] : []),
  ];

  // レイアウトを取得
  const layout = {
    widgets: defaultWidgets.map(defaultWidget => {
      const savedWidget = settings.dashboardLayout?.widgets.find(w => w.id === defaultWidget.id);
      if (savedWidget) {
        return { 
          ...defaultWidget, 
          ...savedWidget,
          width: savedWidget.width ?? defaultWidget.width,
          height: savedWidget.height ?? defaultWidget.height,
          gridX: savedWidget.gridX ?? defaultWidget.gridX,
          gridY: savedWidget.gridY ?? defaultWidget.gridY,
        };
      }
      return defaultWidget;
    }).sort((a, b) => a.order - b.order)
  };

  const visibleWidgets = layout.widgets.filter(w => w.visible);
  const usedWidgetIds = visibleWidgets.map(w => w.id);

  // グリッドマップを生成
  const getGridMap = useCallback(() => {
    const map: (DashboardWidgetType | null)[][] = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    visibleWidgets.forEach(widget => {
      if (widget.id === movingWidget) return; // 移動中のウィジェットは除外
      const x = widget.gridX ?? 0;
      const y = widget.gridY ?? 0;
      const w = widget.width ?? 2;
      const h = widget.height ?? 1;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (y + dy < GRID_ROWS && x + dx < GRID_COLS) {
            map[y + dy][x + dx] = widget.id;
          }
        }
      }
    });
    return map;
  }, [visibleWidgets, movingWidget]);

  // セルの空き状況を確認
  const canPlaceWidget = useCallback((startX: number, startY: number, width: number, height: number, excludeId?: DashboardWidgetType) => {
    const map = getGridMap();
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const y = startY + dy;
        const x = startX + dx;
        if (y >= GRID_ROWS || x >= GRID_COLS) return false;
        if (x + width > GRID_COLS) return false;
        if (map[y][x] !== null && map[y][x] !== excludeId) return false;
      }
    }
    return true;
  }, [getGridMap]);

  // ウィジェット配置
  const placeWidget = (widgetId: DashboardWidgetType, x: number, y: number, width: number, height: number) => {
    const updatedWidgets = layout.widgets.map(w => {
      if (w.id === widgetId) {
        return { ...w, visible: true, gridX: x, gridY: y, width, height };
      }
      return w;
    });
    
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: updatedWidgets }
    });
    
    setSelectedWidget(null);
    setIsEditing(false);
    setMovingWidget(null);
  };

  // ウィジェット削除
  const removeWidget = (widgetId: DashboardWidgetType) => {
    const updatedWidgets = layout.widgets.map(w => 
      w.id === widgetId ? { ...w, visible: false } : w
    );
    updateSettings({
      ...settings,
      dashboardLayout: { widgets: updatedWidgets }
    });
    setSelectedWidget(null);
    setIsEditing(false);
  };

  // グリッドセルをタップして配置
  const handleGridCellClick = (x: number, y: number) => {
    if (!selectedWidget) return;
    if (!canPlaceWidget(x, y, editWidth, editHeight, movingWidget ?? undefined)) return;
    
    placeWidget(selectedWidget, x, y, editWidth, editHeight);
  };

  // ウィジェットをタップして整形ゾーンへ
  const handleWidgetTap = (widget: DashboardWidget) => {
    setSelectedWidget(widget.id);
    setEditWidth(widget.width ?? 2);
    setEditHeight(widget.height ?? 1);
    setIsEditing(true);
  };

  // ウィジェットを長押しで移動モード開始
  const handleWidgetLongPressStart = (widget: DashboardWidget) => {
    longPressRef.current = setTimeout(() => {
      setMovingWidget(widget.id);
      setSelectedWidget(widget.id);
      setEditWidth(widget.width ?? 2);
      setEditHeight(widget.height ?? 1);
      setIsEditing(true);
    }, 500);
  };

  const handleWidgetLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  // ウィジェットをレンダリング（サイズに関係なく表示）
  const renderWidgetContent = (widget: DashboardWidget) => {
    const w = widget.width ?? 2;
    
    switch (widget.id) {
      case 'start_timer':
        return (
          <motion.button
            onClick={() => !isEditMode && setFullscreenTimer(true)}
            className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 overflow-hidden"
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <Maximize2 size={w > 1 ? 20 : 14} />
            {w > 1 && <span className="text-sm">計測開始</span>}
          </motion.button>
        );

      case 'pomodoro_timer':
        return (
          <motion.button
            onClick={() => !isEditMode && setShowPomodoroTimer(true)}
            className="w-full h-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 overflow-hidden"
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <Clock size={w > 1 ? 20 : 14} />
            {w > 1 && <span className="text-sm">ポモドーロ</span>}
          </motion.button>
        );

      case 'progress':
        return (
          <motion.div
            className="w-full h-full bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center overflow-hidden"
            onClick={() => !isEditMode && setShowProgressModal(true)}
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium text-slate-500 truncate">進捗</span>
              <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-lg' : 'text-sm'}`}>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        );

      case 'daily_goal':
        return (
          <div 
            className="w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <Calendar className="text-blue-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(realtimeDailyGoal)}
            </span>
            {w > 1 && <span className="text-[10px] text-slate-500">目標</span>}
          </div>
        );

      case 'today_study':
        return (
          <div 
            className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <Clock className="text-green-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(todayStudiedHours)}
            </span>
            {w > 1 && <span className="text-[10px] text-slate-500">今日</span>}
          </div>
        );

      case 'total_study':
        return (
          <div 
            className="w-full h-full bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <TrendingUp className="text-purple-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(totalStudiedHours)}
            </span>
            {w > 1 && <span className="text-[10px] text-slate-500">総計</span>}
          </div>
        );

      case 'remaining_time':
        return (
          <div className="w-full h-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden">
            <Clock className="text-orange-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatCountdownJapanese(timeRemainingSeconds)}
            </span>
            {w > 1 && <span className="text-[10px] text-slate-500">残り</span>}
          </div>
        );

      case 'category_chart':
        return (
          <div className="w-full h-full overflow-hidden rounded-xl">
            <CategoryChart />
          </div>
        );

      case 'today_review':
        return (
          <div className="w-full h-full overflow-hidden rounded-xl">
            <TodayReviewWidget />
          </div>
        );

      default:
        return null;
    }
  };

  // 編集モードUI
  if (isEditMode) {
    const gridMap = getGridMap();
    
    return (
      <div className="fixed inset-0 z-40 bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* ヘッダー */}
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">レイアウト編集</h2>
          <button
            onClick={() => {
              setIsEditMode(false);
              setSelectedWidget(null);
              setIsEditing(false);
              setMovingWidget(null);
            }}
            className="p-2 rounded-xl bg-primary-600 text-white"
          >
            <Check size={20} />
          </button>
        </header>

        {/* グリッドエリア */}
        <div className="flex-1 overflow-auto p-4">
          <div 
            className="grid gap-1 p-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
          >
            {Array(GRID_ROWS * GRID_COLS).fill(null).map((_, index) => {
              const x = index % GRID_COLS;
              const y = Math.floor(index / GRID_COLS);
              const widgetId = gridMap[y]?.[x];
              const widget = widgetId ? visibleWidgets.find(w => w.id === widgetId) : null;
              
              const isWidgetStart = widget && widget.gridX === x && widget.gridY === y;
              const isWidgetPart = widget && !isWidgetStart;
              const canPlace = selectedWidget && canPlaceWidget(x, y, editWidth, editHeight, movingWidget ?? undefined);
              
              if (isWidgetPart) {
                return null;
              }
              
              if (isWidgetStart && widget) {
                const w = widget.width ?? 2;
                const h = widget.height ?? 1;
                const isSelected = selectedWidget === widget.id;
                
                return (
                  <div
                    key={`widget-${widget.id}`}
                    className={`relative rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                        : 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-700'
                    }`}
                    style={{
                      gridColumn: `span ${w}`,
                      gridRow: `span ${h}`,
                      minHeight: `${h * 50}px`,
                    }}
                    onClick={() => handleWidgetTap(widget)}
                    onTouchStart={() => handleWidgetLongPressStart(widget)}
                    onTouchEnd={handleWidgetLongPressEnd}
                    onMouseDown={() => handleWidgetLongPressStart(widget)}
                    onMouseUp={handleWidgetLongPressEnd}
                    onMouseLeave={handleWidgetLongPressEnd}
                  >
                    <div className="absolute top-1 left-1">
                      <Move size={12} className="text-primary-400" />
                    </div>
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        {WIDGET_NAMES[widget.id]} ({w}×{h})
                      </span>
                    </div>
                  </div>
                );
              }
              
              // 空きセル
              return (
                <div
                  key={`cell-${x}-${y}`}
                  onClick={() => canPlace && handleGridCellClick(x, y)}
                  className={`aspect-square border-2 rounded transition-colors flex items-center justify-center text-[10px] ${
                    canPlace
                      ? 'border-primary-400 bg-primary-100 dark:bg-primary-900/30 cursor-pointer hover:bg-primary-200'
                      : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  {canPlace && <Plus size={14} className="text-primary-500" />}
                </div>
              );
            })}
          </div>
          
          {movingWidget && (
            <p className="text-center text-xs text-primary-600 dark:text-primary-400 mt-2">
              移動モード: 空きセルをタップして再配置
            </p>
          )}
        </div>

        {/* 整形ゾーン */}
        {selectedWidget && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {WIDGET_NAMES[selectedWidget]} の整形
              </span>
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    onClick={() => removeWidget(selectedWidget)}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg"
                  >
                    削除
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedWidget(null);
                    setIsEditing(false);
                    setMovingWidget(null);
                  }}
                  className="text-xs text-slate-500"
                >
                  キャンセル
                </button>
              </div>
            </div>
            
            {/* 幅スライダー */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-500 w-8">幅</span>
              <button onClick={() => setEditWidth(Math.max(1, editWidth - 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700">
                <Minus size={14} />
              </button>
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <div 
                    key={n}
                    onClick={() => setEditWidth(n)}
                    className={`flex-1 h-6 rounded cursor-pointer transition-colors ${
                      n <= editWidth ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <button onClick={() => setEditWidth(Math.min(4, editWidth + 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700">
                <Plus size={14} />
              </button>
              <span className="text-xs font-medium w-8 text-right">{editWidth}</span>
            </div>
            
            {/* 高さスライダー */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-8">高さ</span>
              <button onClick={() => setEditHeight(Math.max(1, editHeight - 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700">
                <Minus size={14} />
              </button>
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <div 
                    key={n}
                    onClick={() => setEditHeight(n)}
                    className={`flex-1 h-6 rounded cursor-pointer transition-colors ${
                      n <= editHeight ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <button onClick={() => setEditHeight(Math.min(4, editHeight + 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700">
                <Plus size={14} />
              </button>
              <span className="text-xs font-medium w-8 text-right">{editHeight}</span>
            </div>
            
            {/* 適用ボタン（編集中の場合） */}
            {isEditing && !movingWidget && (
              <button
                onClick={() => {
                  const widget = visibleWidgets.find(w => w.id === selectedWidget);
                  if (widget) {
                    placeWidget(selectedWidget, widget.gridX ?? 0, widget.gridY ?? 0, editWidth, editHeight);
                  }
                }}
                className="w-full mt-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
              >
                サイズを適用
              </button>
            )}
          </div>
        )}

        {/* ウィジェットパレット */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 safe-area-pb">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 text-center">
            配置済み→タップで整形 / 長押しで移動 | 未配置→タップで選択
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allWidgetIds.map((id) => {
              const isUsed = usedWidgetIds.includes(id);
              const isSelected = selectedWidget === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (!isUsed) {
                      setSelectedWidget(isSelected ? null : id);
                      setEditWidth(2);
                      setEditHeight(1);
                      setIsEditing(false);
                      setMovingWidget(null);
                    }
                  }}
                  disabled={isUsed}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isUsed 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : isSelected
                        ? 'bg-primary-600 text-white scale-105'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary-50'
                  }`}
                >
                  {WIDGET_ICONS[id]}
                  <span className="text-[10px] font-medium whitespace-nowrap">{WIDGET_NAMES[id]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 通常モードUI
  return (
    <div className="space-y-4 pb-24 md:pb-6">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ダッシュボード</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        
        <button
          onClick={() => setIsEditMode(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <Pencil size={20} />
        </button>
      </header>

      {/* ウィジェットグリッド */}
      <div 
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {visibleWidgets.map((widget) => {
          const w = widget.width ?? 2;
          const h = widget.height ?? 1;
          return (
            <div 
              key={widget.id}
              style={{
                gridColumn: `span ${w}`,
                gridRow: `span ${h}`,
                minHeight: `${h * 60}px`,
              }}
            >
              {renderWidgetContent(widget)}
            </div>
          );
        })}
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

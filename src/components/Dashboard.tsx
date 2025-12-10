import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudy } from '../context/StudyContext';
import { Timer } from './Timer';
import { PomodoroTimer } from './PomodoroTimer';
import { Target, Calendar, Clock, TrendingUp, Maximize2, Pencil, Check, Eye, Minus, Plus, X, Skull, Flame } from 'lucide-react';
import type { DashboardWidget, DashboardWidgetType } from '../types';
import { formatTimeJapanese, formatCountdownJapanese } from '../utils/timeFormat';
import { CategoryChart } from './CategoryChart';
import { StreakWidget } from './widgets/StreakWidget';
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
  sabotage_mode: 'サボり',
  streak: '継続',
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
  sabotage_mode: <Skull size={16} />,
  streak: <Flame size={16} />,
};

// 削除確認モーダル
const DeleteConfirmModal: React.FC<{
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">削除確認</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">{title}を削除しますか？</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl font-medium"
        >
          削除
        </button>
      </div>
    </div>
  </div>
);

// ウィジェット詳細モーダル（小サイズ時のタップで表示）
const WidgetDetailModal: React.FC<{
  widget: DashboardWidget;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ widget, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 max-w-md w-full shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{WIDGET_NAMES[widget.id]}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <X size={20} className="text-slate-500" />
        </button>
      </div>
      <div className="min-h-[200px]">
        {children}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const {
    totalStudiedHours,
    todayStudiedHours,
    settings,
    updateSettings,
    timeRemainingSeconds,
    setIsSwipeEnabled
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
  const [isEditing, setIsEditing] = useState(false);
  const [movingWidget, setMovingWidget] = useState<DashboardWidgetType | null>(null);
  
  // 削除確認とウィジェット詳細
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: DashboardWidgetType; name: string } | null>(null);
  const [detailWidget, setDetailWidget] = useState<DashboardWidget | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 編集モード中はスワイプナビゲーションを無効化
  useEffect(() => {
    if (isEditMode) {
      setIsSwipeEnabled(false);
      return () => setIsSwipeEnabled(true);
    }
  }, [isEditMode, setIsSwipeEnabled]);

  const now = currentTime;
  const endDateParsed = settings.endDate ? new Date(settings.endDate) : null;
  const timeUntilEnd = endDateParsed ? Math.max(0, endDateParsed.getTime() - now.getTime()) : 0;
  const hoursUntilEnd = timeUntilEnd / (1000 * 60 * 60);
  const remainingHoursToStudy = Math.max(0, settings.targetHours - totalStudiedHours);
  const realtimeDailyGoal = hoursUntilEnd > 0 ? (remainingHoursToStudy / hoursUntilEnd) * 24 : 0;

  const reviewEnabled = settings.reviewSettings?.enabled || false;
  const confirmBeforeDelete = settings.confirmBeforeDelete !== false; // デフォルトtrue

  const allWidgetIds: DashboardWidgetType[] = [
    'start_timer', 'pomodoro_timer', 'progress', 'daily_goal', 
    'today_study', 'total_study', 'remaining_time', 'category_chart',
    'sabotage_mode', 'streak',
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
    { id: 'streak', visible: true, order: 8, size: 'small', width: 2, height: 1, gridX: 0, gridY: 6 },
    { id: 'sabotage_mode', visible: true, order: 9, size: 'small', width: 2, height: 1, gridX: 2, gridY: 6 }, // 暫定配置
    ...(reviewEnabled ? [{ id: 'today_review' as const, visible: true, order: 10, size: 'large' as const, width: 4, height: 1, gridX: 0, gridY: 7 }] : []),
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
    }).sort((a, b) => (a.gridY ?? 0) * GRID_COLS + (a.gridX ?? 0) - ((b.gridY ?? 0) * GRID_COLS + (b.gridX ?? 0)))
  };

  const visibleWidgets = layout.widgets.filter(w => w.visible);
  

  const usedWidgetIds = visibleWidgets.map(w => w.id);

  // グリッドマップを生成
  const getGridMap = useCallback((excludeId?: DashboardWidgetType) => {
    const map: (DashboardWidgetType | null)[][] = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    visibleWidgets.forEach(widget => {
      if (widget.id === excludeId) return;
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
  }, [visibleWidgets]);

  // セルの空き状況を確認（修正版）
  const canPlaceWidget = useCallback((startX: number, startY: number, width: number, height: number, excludeId?: DashboardWidgetType) => {
    // 範囲チェック
    if (startX < 0 || startY < 0) return false;
    if (startX + width > GRID_COLS) return false;
    if (startY + height > GRID_ROWS) return false;
    
    const map = getGridMap(excludeId);
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const y = startY + dy;
        const x = startX + dx;
        if (map[y][x] !== null) return false;
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
    setDeleteConfirm(null);
  };

  // 削除ハンドラー（確認付き）
  const handleDeleteWidget = (widgetId: DashboardWidgetType) => {
    if (confirmBeforeDelete) {
      setDeleteConfirm({ id: widgetId, name: WIDGET_NAMES[widgetId] });
    } else {
      removeWidget(widgetId);
    }
  };

  // グリッドセルをタップして配置
  const handleGridCellClick = (x: number, y: number) => {
    if (!selectedWidget) return;
    
    // 移動モード時は移動するウィジェットを除外してチェック
    const excludeId = movingWidget ?? undefined;
    if (!canPlaceWidget(x, y, editWidth, editHeight, excludeId)) return;
    
    placeWidget(selectedWidget, x, y, editWidth, editHeight);
  };

  // ウィジェットをタップして整形ゾーンへ
  const handleWidgetTap = (widget: DashboardWidget) => {
    setSelectedWidget(widget.id);
    setEditWidth(widget.width ?? 2);
    setEditHeight(widget.height ?? 1);
    setIsEditing(true);
    setMovingWidget(null);
  };

  // 移動モード開始
  const handleMoveWidget = (widget: DashboardWidget) => {
    setSelectedWidget(widget.id);
    setEditWidth(widget.width ?? 2);
    setEditHeight(widget.height ?? 1);
    setMovingWidget(widget.id);
    setIsEditing(true);
  };

  // サイズが小さいかどうか判定
  const isSmallWidget = (widget: DashboardWidget) => {
    const w = widget.width ?? 2;
    const h = widget.height ?? 1;
    // 1x1または複雑なウィジェットで2x1未満
    if ((widget.id === 'category_chart' || widget.id === 'today_review') && (w < 2 || h < 2)) return true;
    if (widget.id === 'progress' && w < 2) return true;
    return w === 1 && h === 1;
  };

  // ウィジェットをレンダリング
  const renderWidgetContent = (widget: DashboardWidget, forModal = false) => {
    const w = widget.width ?? 2;
    const h = widget.height ?? 1;
    const small = !forModal && isSmallWidget(widget);
    
    // 小サイズ時はタイトルのみ
    if (small) {
      return (
        <div 
          className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setDetailWidget(widget)}
        >
          {WIDGET_ICONS[widget.id]}
          <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{WIDGET_NAMES[widget.id]}</span>
        </div>
      );
    }
    
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
            className="w-full h-full bg-white dark:bg-slate-800 rounded-xl p-2 border-2 border-slate-200 dark:border-slate-600 shadow-md flex flex-col justify-center overflow-hidden"
            onClick={() => !isEditMode && setShowProgressModal(true)}
            whileTap={isEditMode ? undefined : { scale: 0.98 }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">
                {progress >= 100 ? '目標達成！🎉' : progress >= 80 ? 'あと少し！🔥' : '進捗'}
              </span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${w > 1 ? 'text-lg' : 'text-sm'} ${progress >= 80 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : progress >= 80 ? 'bg-gradient-to-r from-primary-500 to-indigo-500' : 'bg-primary-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  boxShadow: progress >= 80 ? '0 0 10px rgba(99, 102, 241, 0.5)' : 'none'
                }}
              />
            </div>
          </motion.div>
        );

      case 'daily_goal':
        return (
          <div 
            className="w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer border-2 border-blue-200 dark:border-blue-800 shadow-md"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <Calendar className="text-blue-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(realtimeDailyGoal)}
            </span>
            {w > 1 && <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">目標</span>}
          </div>
        );

      case 'today_study':
        return (
          <div 
            className="w-full h-full bg-green-50 dark:bg-green-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer border-2 border-green-200 dark:border-green-800 shadow-md"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <Clock className="text-green-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(todayStudiedHours)}
            </span>
            {w > 1 && <span className="text-[10px] font-medium text-green-600 dark:text-green-400">今日</span>}
          </div>
        );

      case 'total_study':
        return (
          <div 
            className="w-full h-full bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer border-2 border-purple-200 dark:border-purple-800 shadow-md"
            onClick={() => !isEditMode && setShowStudyTimeModal(true)}
          >
            <TrendingUp className="text-purple-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatTimeJapanese(totalStudiedHours)}
            </span>
            {w > 1 && <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">総計</span>}
          </div>
        );

      case 'remaining_time':
        return (
          <div className="w-full h-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-md">
            <Clock className="text-orange-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold text-slate-800 dark:text-slate-100 ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              {formatCountdownJapanese(timeRemainingSeconds)}
            </span>
            {w > 1 && <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">残り</span>}
          </div>
        );

      case 'category_chart':
        return (
          <div className="w-full h-full overflow-hidden rounded-xl">
            <CategoryChart />
          </div>
        );

      case 'sabotage_mode':
        return (
          <div 
            className="w-full h-full bg-slate-800 text-white rounded-xl p-2 flex flex-col justify-center items-center overflow-hidden cursor-pointer shadow-md border-2 border-slate-700 hover:bg-slate-700 transition-colors relative z-10"
            onClick={() => !isEditMode && setShowSabotageModal(true)}
          >
            <Skull className="text-red-500" size={w > 1 ? 20 : 14} />
            <span className={`font-bold ${w > 1 ? 'text-sm' : 'text-xs'} mt-1`}>
              サボる
            </span>
            {w > 1 && <span className="text-[10px] font-medium text-slate-400">モード</span>}
          </div>
        );

      case 'today_review':
        return (
          <div className="w-full h-full overflow-hidden rounded-xl">
            <TodayReviewWidget />
          </div>
        );

      case 'streak':
        return (
          <div className="w-full h-full overflow-hidden rounded-xl">
            <StreakWidget isSmall={w < 2 || h < 2} />
          </div>
        );

      default:
        return null;
    }
  };

  // 編集モードUI
  if (isEditMode) {
    const gridMap = getGridMap(movingWidget ?? undefined);
    
    return (
      <div className="fixed inset-0 z-40 bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* ヘッダー */}
        <header className="flex justify-between items-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">レイアウト編集</h2>
          <button
            onClick={() => {
              setIsEditMode(false);
              setSelectedWidget(null);
              setIsEditing(false);
              setMovingWidget(null);
            }}
            className="p-2 rounded-xl bg-primary-600 text-white mt-2 shadow-sm"
          >
            <Check size={20} />
          </button>
        </header>

        {/* グリッドエリア */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 text-center">
            タップで編集 / 「移動」ボタンで再配置
          </p>
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-1"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: '4px',
            }}
          >
            {/* グリッドセルとウィジェット */}
            {Array(GRID_ROWS).fill(null).map((_, rowIndex) => (
              Array(GRID_COLS).fill(null).map((_, colIndex) => {
                const x = colIndex;
                const y = rowIndex;
                const widgetId = gridMap[y]?.[x];
                const widget = widgetId ? visibleWidgets.find(w => w.id === widgetId) : null;
                
                const isWidgetStart = widget && widget.gridX === x && widget.gridY === y;
                const isWidgetPart = widget && !isWidgetStart;
                const canPlace = selectedWidget && canPlaceWidget(x, y, editWidth, editHeight, movingWidget ?? undefined);
                
                if (isWidgetPart) return null;
                
                if (isWidgetStart && widget) {
                  const gw = widget.width ?? 2;
                  const gh = widget.height ?? 1;
                  const isSelected = selectedWidget === widget.id;
                  
                  return (
                    <div
                      key={`widget-${widget.id}`}
                      className={`rounded-lg transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
                      style={{
                        gridColumn: `span ${gw}`,
                        gridRow: `span ${gh}`,
                        minHeight: '60px',
                      }}
                      onClick={() => handleWidgetTap(widget)}
                    >
                      <div className="w-full h-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                          {WIDGET_NAMES[widget.id]} ({gw}×{gh})
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
              })
            )).flat().filter(Boolean)}
          </div>
          
          {movingWidget && (
            <p className="text-center text-xs text-primary-600 dark:text-primary-400 mt-2">
              移動先の空きセルをタップしてください
            </p>
          )}
        </div>

        {/* 整形ゾーン */}
        {selectedWidget && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {WIDGET_NAMES[selectedWidget]} の編集
              </span>
              <button onClick={() => { setSelectedWidget(null); setIsEditing(false); setMovingWidget(null); }} className="text-xs text-slate-500">
                閉じる
              </button>
            </div>
            
            {/* 幅 */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-slate-500 w-8">幅</span>
              <button onClick={() => setEditWidth(Math.max(1, editWidth - 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700"><Minus size={14} /></button>
              <div className="flex-1 flex gap-1">
                {[1,2,3,4].map(n => (
                  <div key={n} onClick={() => setEditWidth(n)} className={`flex-1 h-6 rounded cursor-pointer ${n <= editWidth ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                ))}
              </div>
              <button onClick={() => setEditWidth(Math.min(4, editWidth + 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700"><Plus size={14} /></button>
              <span className="text-xs w-6 text-right">{editWidth}</span>
            </div>
            
            {/* 高さ */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-slate-500 w-8">高さ</span>
              <button onClick={() => setEditHeight(Math.max(1, editHeight - 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700"><Minus size={14} /></button>
              <div className="flex-1 flex gap-1">
                {[1,2,3,4].map(n => (
                  <div key={n} onClick={() => setEditHeight(n)} className={`flex-1 h-6 rounded cursor-pointer ${n <= editHeight ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-600'}`} />
                ))}
              </div>
              <button onClick={() => setEditHeight(Math.min(4, editHeight + 1))} className="p-1 rounded bg-slate-100 dark:bg-slate-700"><Plus size={14} /></button>
              <span className="text-xs w-6 text-right">{editHeight}</span>
            </div>
            
            {/* ボタン */}
            <div className="flex gap-2">
              {isEditing && !movingWidget && (
                <>
                  <button
                    onClick={() => {
                      const widget = visibleWidgets.find(w => w.id === selectedWidget);
                      if (widget) placeWidget(selectedWidget, widget.gridX ?? 0, widget.gridY ?? 0, editWidth, editHeight);
                    }}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
                  >
                    サイズ適用
                  </button>
                  <button
                    onClick={() => {
                      const widget = visibleWidgets.find(w => w.id === selectedWidget);
                      if (widget) handleMoveWidget(widget);
                    }}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    移動
                  </button>
                  <button
                    onClick={() => handleDeleteWidget(selectedWidget)}
                    className="py-2 px-4 bg-red-500 text-white rounded-lg text-sm font-medium"
                  >
                    削除
                  </button>
                </>
              )}
              {movingWidget && (
                <button
                  onClick={() => setMovingWidget(null)}
                  className="flex-1 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                >
                  移動キャンセル
                </button>
              )}
            </div>
          </div>
        )}

        {/* ウィジェットパレット */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 safe-area-pb">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allWidgetIds.map((id) => {
              const isUsed = usedWidgetIds.includes(id);
              const isSelected = selectedWidget === id && !isEditing;
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
                    isUsed ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' 
                      : isSelected ? 'bg-primary-600 text-white scale-105'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {WIDGET_ICONS[id]}
                  <span className="text-[10px] font-medium">{WIDGET_NAMES[id]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 削除確認モーダル */}
        {deleteConfirm && (
          <DeleteConfirmModal
            title={deleteConfirm.name}
            onConfirm={() => removeWidget(deleteConfirm.id)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    );
  }

  // 通常モードUI - グリッド位置を厳密に守る
  const maxY = Math.max(...visibleWidgets.map(w => (w.gridY ?? 0) + (w.height ?? 1)), 1);
  
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
          id="edit-layout-button"
          onClick={() => setIsEditMode(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <Pencil size={20} />
        </button>
      </header>

      {/* ウィジェットグリッド */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, 60px)`,
          gap: '12px',
        }}
      >
        {visibleWidgets.map((widget) => {
          const gx = widget.gridX ?? 0;
          const gy = widget.gridY ?? 0;
          const w = widget.width ?? 2;
          const h = widget.height ?? 1;
          
          return (
            <div 
              key={widget.id}
              id={`widget-${widget.id}`}
              style={{
                gridColumn: `${gx + 1} / ${gx + w + 1}`,
                gridRow: `${gy + 1} / ${gy + h + 1}`,
              }}
            >
              {renderWidgetContent(widget)}
            </div>
          );
        })}
      </div>

      {/* ウィジェット詳細モーダル */}
      {detailWidget && (
        <WidgetDetailModal widget={detailWidget} onClose={() => setDetailWidget(null)}>
          {renderWidgetContent(detailWidget, true)}
        </WidgetDetailModal>
      )}

      {/* Modals */}
      <AnimatePresence>
        {fullscreenTimer && <Timer fullscreen onClose={() => setFullscreenTimer(false)} />}
        {showPomodoroTimer && <PomodoroTimer onClose={() => setShowPomodoroTimer(false)} />}
        {showSabotageModal && <SabotageModal dailyGoalHours={realtimeDailyGoal} onClose={() => setShowSabotageModal(false)} />}
        {showProgressModal && <ProgressDetailModal onClose={() => setShowProgressModal(false)} />}
        {showStudyTimeModal && <StudyTimeDetailModal onClose={() => setShowStudyTimeModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

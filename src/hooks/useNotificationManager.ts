import { useCallback, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { useNotification } from './useNotification';
import { formatTime } from '../utils/timeFormat';
import type { NotificationSettings } from '../types';

interface NotificationManagerOptions {
  elapsed: number;
  isRunning: boolean;
  selectedCategory: number;
  isPomodoroMode?: boolean;
  isPomodoroBreak?: boolean;
}

export const useNotificationManager = (options: NotificationManagerOptions) => {
  const { elapsed, isRunning, selectedCategory, isPomodoroMode, isPomodoroBreak } = options;
  const { settings } = useStudy();
  const { showNotification } = useNotification();
  
  const notifSettings = settings.notificationSettings;
  // 通知が有効かチェック
  const isNotificationEnabled = useCallback((type: keyof NotificationSettings) => {
    return notifSettings?.enabled && notifSettings?.[type] as boolean;
  }, [notifSettings]);

  // カテゴリ情報を取得
  const getCategoryName = useCallback((categoryId: number): string => {
    const category = settings.categories.find(c => c.id === categoryId);
    return category?.name || '未設定';
  }, [settings.categories]);

  // ポモドーロタイマー完了通知（設定enabledなら常に通知、または明示的な設定がないためenabled連動とする）
  useEffect(() => {
    if (!isRunning || !isPomodoroMode || !notifSettings?.enabled) return;

    const pomodoroSettings = notifSettings;
    const focusSeconds = pomodoroSettings.pomodoroFocusMinutes * 60;
    const breakSeconds = pomodoroSettings.pomodoroBreakMinutes * 60;

    // 集中時間終了
    if (!isPomodoroBreak && elapsed === focusSeconds) {
      showNotification('🍅 集中時間終了！', {
        body: `お疲れ様でした。${pomodoroSettings.pomodoroBreakMinutes}分間の休憩を取りましょう。`,
        icon: '/icon.svg',
        tag: 'pomodoro-focus-complete',
      } as any);
    }

    // 休憩時間終了
    if (isPomodoroBreak && elapsed === breakSeconds) {
      showNotification('🍅 休憩終了！', {
        body: `次の集中時間(${pomodoroSettings.pomodoroFocusMinutes}分)を始めましょう。`,
        icon: '/icon.svg',
        tag: 'pomodoro-break-complete',
      } as any);
    }
  }, [elapsed, isRunning, isPomodoroMode, isPomodoroBreak, notifSettings, showNotification]);

  // タイマー実行中の通知更新（常時表示）
  useEffect(() => {
    // 通常タイマーの場合
    if (!isPomodoroMode && (!isRunning || !isNotificationEnabled('timerProgressNotification'))) return;
    // ポモドーロの場合
    if (isPomodoroMode && (!isRunning || !isNotificationEnabled('pomodoroProgressNotification'))) return;

    // 1分ごとに更新 (0秒, 60秒, 120秒...)
    if (elapsed % 60 !== 0 && elapsed !== 0) return;

    const categoryName = getCategoryName(selectedCategory);
    const timeStr = formatTime(elapsed);
    
    let body = `${categoryName} - ${timeStr}`;
    let title = '学習記録中';
    
    if (isPomodoroMode) {
      if (isPomodoroBreak) {
        title = '休憩中';
        body = `🍅 休憩 - ${timeStr}`;
      } else {
        title = '集中モード';
        body = `🍅 集中 - ${timeStr}`;
      }
    }

    // 通知を更新 (ID: 1002 で固定)
    showNotification(title, {
      body,
      icon: '/icon.svg',
      tag: 'study-timer',
      silent: true,
      renotify: false,
      id: 1002,
      ongoing: true,
    } as any);
  }, [elapsed, isRunning, selectedCategory, isPomodoroMode, isPomodoroBreak, isNotificationEnabled, getCategoryName, showNotification]);

  return {
    isNotificationEnabled,
  };
};

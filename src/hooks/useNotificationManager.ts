import { useCallback, useEffect, useRef } from 'react';
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
  const { settings, todayStudiedHours, dailyGoalHours, timeRemainingSeconds } = useStudy();
  const { showNotification } = useNotification();
  
  const notifSettings = settings.notificationSettings;
  const lastNotificationTime = useRef<number>(0);
  const hasShownDailyGoal = useRef<boolean>(false);
  const hasShownDeadlineWarning = useRef<boolean>(false);
  const dailyReminderShown = useRef<boolean>(false);
  const eveningReminderShown = useRef<boolean>(false);

  // 通知が有効かチェック
  const isNotificationEnabled = useCallback((type: keyof NotificationSettings) => {
    return notifSettings?.enabled && notifSettings?.[type] as boolean;
  }, [notifSettings]);

  // カテゴリ情報を取得
  const getCategoryName = useCallback((categoryId: number): string => {
    const category = settings.categories.find(c => c.id === categoryId);
    return category?.name || '未設定';
  }, [settings.categories]);

  // ポモドーロタイマー通知
  useEffect(() => {
    if (!isRunning || !isPomodoroMode || !isNotificationEnabled('pomodoroTimer')) return;

    const pomodoroSettings = notifSettings!;
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
  }, [elapsed, isRunning, isPomodoroMode, isPomodoroBreak, isNotificationEnabled, notifSettings, showNotification]);

  // タイマー実行中の通知更新（常時表示）
  useEffect(() => {
    if (!isRunning || !isNotificationEnabled('timerCompletion')) return;

    const categoryName = getCategoryName(selectedCategory);
    const timeStr = formatTime(elapsed);
    
    let body = `${categoryName} - ${timeStr}`;
    
    if (isPomodoroMode) {
      if (isPomodoroBreak) {
        body = `🍅 休憩中 - ${timeStr}`;
      } else {
        body = `🍅 集中中 - ${timeStr}`;
      }
    }

    // 1秒ごとに通知を更新
    showNotification('学習記録中', {
      body,
      icon: '/icon.svg',
      tag: 'study-timer',
      silent: true,
      renotify: false, // 音やバイブレーションを鳴らさない
    } as any);
  }, [elapsed, isRunning, selectedCategory, isPomodoroMode, isPomodoroBreak, isNotificationEnabled, getCategoryName, showNotification]);

  // 長時間学習リマインダー
  useEffect(() => {
    if (!isRunning || !isNotificationEnabled('longStudyBreak')) return;

    const breakMinutes = notifSettings?.longStudyBreakMinutes || 120;
    const breakSeconds = breakMinutes * 60;

    if (elapsed === breakSeconds) {
      const categoryName = getCategoryName(selectedCategory);
      showNotification('⏰ 休憩のお知らせ', {
        body: `${breakMinutes}分間連続で学習中です(${categoryName})。休憩を取りましょう！`,
        icon: '/icon.svg',
        tag: 'long-study-break',
      } as any);
    }
  }, [elapsed, isRunning, selectedCategory, isNotificationEnabled, notifSettings, getCategoryName, showNotification]);

  // 日次目標達成通知
  useEffect(() => {
    if (!isNotificationEnabled('dailyGoalAchievement')) return;

    if (todayStudiedHours >= dailyGoalHours && dailyGoalHours > 0 && !hasShownDailyGoal.current) {
      hasShownDailyGoal.current = true;
      showNotification('🎉 本日の目標達成！', {
        body: `おめでとうございます！今日の目標 ${dailyGoalHours.toFixed(1)}時間 を達成しました！`,
        icon: '/icon.svg',
        tag: 'daily-goal-achievement',
      } as any);
    }

    // リセット（翌日のために）
    if (todayStudiedHours < dailyGoalHours) {
      hasShownDailyGoal.current = false;
    }
  }, [todayStudiedHours, dailyGoalHours, isNotificationEnabled, showNotification]);

  // 日次リマインダー
  useEffect(() => {
    if (!isNotificationEnabled('dailyReminder')) return;

    const checkDailyReminder = () => {
      const now = new Date();
      const [hours, minutes] = (notifSettings?.dailyReminderTime || '09:00').split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes && !dailyReminderShown.current) {
        dailyReminderShown.current = true;
        showNotification('📚 学習開始のお知らせ', {
          body: `今日の目標: ${dailyGoalHours.toFixed(1)}時間\n学習を始めましょう！`,
          icon: '/icon.svg',
          tag: 'daily-reminder',
        } as any);

        // 1分後にリセット
        setTimeout(() => {
          dailyReminderShown.current = false;
        }, 60000);
      }
    };

    const interval = setInterval(checkDailyReminder, 30000); // 30秒ごとにチェック
    checkDailyReminder(); // 初回実行

    return () => clearInterval(interval);
  }, [isNotificationEnabled, dailyGoalHours, notifSettings, showNotification]);

  // 夜間リマインダー
  useEffect(() => {
    if (!isNotificationEnabled('eveningReminder')) return;

    const checkEveningReminder = () => {
      const now = new Date();
      const [hours, minutes] = (notifSettings?.eveningReminderTime || '20:00').split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes && !eveningReminderShown.current) {
        if (todayStudiedHours < dailyGoalHours) {
          const remaining = dailyGoalHours - todayStudiedHours;
          eveningReminderShown.current = true;
          showNotification('🌙 今日の学習進捗', {
            body: `残り ${remaining.toFixed(1)}時間 で目標達成です。\n現在: ${todayStudiedHours.toFixed(1)}時間 / 目標: ${dailyGoalHours.toFixed(1)}時間`,
            icon: '/icon.svg',
            tag: 'evening-reminder',
          } as any);

          // 1分後にリセット
          setTimeout(() => {
            eveningReminderShown.current = false;
          }, 60000);
        }
      }
    };

    const interval = setInterval(checkEveningReminder, 30000); // 30秒ごとにチェック
    checkEveningReminder(); // 初回実行

    return () => clearInterval(interval);
  }, [isNotificationEnabled, todayStudiedHours, dailyGoalHours, notifSettings, showNotification]);

  // 期限警告
  useEffect(() => {
    if (!isNotificationEnabled('deadlineWarning')) return;

    const oneDayInSeconds = 24 * 60 * 60;
    const oneWeekInSeconds = 7 * oneDayInSeconds;

    // 1日前の警告
    if (timeRemainingSeconds <= oneDayInSeconds && timeRemainingSeconds > 0 && !hasShownDeadlineWarning.current) {
      hasShownDeadlineWarning.current = true;
      const hoursRemaining = Math.floor(timeRemainingSeconds / 3600);
      showNotification('⚠️ 期限警告', {
        body: `目標期限まであと ${hoursRemaining}時間です！\n計画的に学習を進めましょう。`,
        icon: '/icon.svg',
        tag: 'deadline-warning',
      } as any);
    }

    // 1週間前の警告（軽め）
    if (timeRemainingSeconds <= oneWeekInSeconds && timeRemainingSeconds > oneDayInSeconds) {
      if (Date.now() - lastNotificationTime.current > 24 * 60 * 60 * 1000) {
        lastNotificationTime.current = Date.now();
        const daysRemaining = Math.floor(timeRemainingSeconds / oneDayInSeconds);
        showNotification('📅 期限のお知らせ', {
          body: `目標期限まであと ${daysRemaining}日です。`,
          icon: '/icon.svg',
          tag: 'deadline-reminder',
        });
      }
    }
  }, [timeRemainingSeconds, isNotificationEnabled, showNotification]);

  return {
    isNotificationEnabled,
  };
};

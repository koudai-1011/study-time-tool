import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { useNotification } from '../hooks/useNotification';
import { Bell, Clock, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import type { NotificationSettings as NotificationSettingsType } from '../types';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
  enabled: true,
  reviewNotification: true,
  reviewNotificationTime: '09:00',
  timerProgressNotification: true,
  pomodoroProgressNotification: true,
  goalCheckNotification: true,
  goalCheckTime: '21:00',
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
};

export const NotificationSettings: React.FC = () => {
  const { settings, updateSettings, dailyGoalHours } = useStudy();
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsType>(
    settings.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNotifSettings(settings.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS);
  }, [settings.notificationSettings]);

  const handleToggle = (key: keyof NotificationSettingsType) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeChange = (key: keyof NotificationSettingsType, value: string) => {
    setNotifSettings(prev => ({ ...prev, [key]: value }));
  };

  const { scheduleRepeatingNotification, cancelNotification, requestPermission } = useNotification();

  const handleSave = async () => {
    updateSettings({ ...settings, notificationSettings: notifSettings });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    // 通知権限リクエスト
    if (notifSettings.enabled) {
      await requestPermission();
    }

    // 復習通知の設定 (ID: 1001)
    if (notifSettings.enabled && notifSettings.reviewNotification && notifSettings.reviewNotificationTime) {
      const [hour, minute] = notifSettings.reviewNotificationTime.split(':').map(Number);
      await scheduleRepeatingNotification(
        1001,
        '📚 本日の復習',
        '復習するべき項目があります。確認しましょう！',
        hour,
        minute
      );
    } else {
      await cancelNotification(1001);
    }

    // 目標達成チェック通知の設定 (ID: 1002)
    // 実際には日次バッチなどで目標達成判定が必要だが、ここでは指定時間に「状況確認」を促す通知として設定する。
    // 通知の文言は「目標達成状況を確認しましょう」とする。
    // ※要件では「達成できていません」だが、静的なスケジュールでは判定できないため、毎日定時にチェックを促す形にするか、
    // あるいはアプリ起動時にバックグラウンド処理が必要だが、Web/Capacitorの制約上、単純な繰り返し通知で実装する。
    // 通知受信時にアプリを開いて確認してもらうフロー。
    if (notifSettings.enabled && notifSettings.goalCheckNotification && notifSettings.goalCheckTime) {
      const [hour, minute] = notifSettings.goalCheckTime.split(':').map(Number);
      await scheduleRepeatingNotification(
        1002,
        '🎯 今日の目標確認',
        `本日の目標時間は${dailyGoalHours.toFixed(1)}時間です。達成状況を確認しましょう！`,
        hour,
        minute
      );
    } else {
      await cancelNotification(1002);
    }
  };

  return (
    <div className="space-y-6">
      {/* 通知全体のオンオフ */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-primary-600 dark:text-primary-400" size={24} />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">通知を有効にする</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">すべての通知機能のマスタースイッチ</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              notifSettings.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                notifSettings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 通知設定項目 */}
      <div className={`space-y-4 transition-opacity duration-300 ${
        !notifSettings.enabled ? 'opacity-50 pointer-events-none grayscale' : ''
      }`}>
        
        {/* 復習通知 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-blue-500" size={20} />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">復習リマインダー</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">本日の復習内容を通知します</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('reviewNotification')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifSettings.reviewNotification ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifSettings.reviewNotification ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {notifSettings.reviewNotification && (
            <div className="ml-8 mt-2 pl-4 border-l-2 border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                通知時刻
              </label>
              <input
                type="time"
                value={notifSettings.reviewNotificationTime}
                onChange={(e) => handleTimeChange('reviewNotificationTime', e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
              />
            </div>
          )}
        </div>

        {/* 目標未達通知 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">目標達成チェック</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">指定時刻に目標達成状況を確認・通知します</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('goalCheckNotification')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifSettings.goalCheckNotification ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifSettings.goalCheckNotification ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {notifSettings.goalCheckNotification && (
            <div className="ml-8 mt-2 pl-4 border-l-2 border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                通知時刻
              </label>
              <input
                type="time"
                value={notifSettings.goalCheckTime}
                onChange={(e) => handleTimeChange('goalCheckTime', e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
              />
            </div>
          )}
        </div>

        {/* タイマー常時表示 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-emerald-500" size={20} />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">通常タイマー常時表示</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">計測中に通知欄に経過時間を表示し続けます</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('timerProgressNotification')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifSettings.timerProgressNotification ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifSettings.timerProgressNotification ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* ポモドーロ常時表示 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-orange-500" size={20} />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">ポモドーロ常時表示</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">計測中に通知欄に残り時間と状態を表示します</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('pomodoroProgressNotification')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifSettings.pomodoroProgressNotification ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifSettings.pomodoroProgressNotification ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98]"
      >
        {isSaved ? '保存しました！' : '設定を保存'}
      </button>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { useNotification } from '../hooks/useNotification';
import { Bell, Clock, Target, Calendar, Moon, AlertTriangle } from 'lucide-react';
import type { NotificationSettings as NotificationSettingsType } from '../types';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
  enabled: true,
  pomodoroTimer: false,
  timerCompletion: true,
  longStudyBreak: true,
  dailyGoalAchievement: true,
  dailyReminder: false,
  eveningReminder: false,
  deadlineWarning: true,
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
  dailyReminderTime: '09:00',
  eveningReminderTime: '20:00',
  longStudyBreakMinutes: 120,
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

  const handleNumberChange = (key: keyof NotificationSettingsType, value: number) => {
    setNotifSettings(prev => ({ ...prev, [key]: value }));
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

    // 日次リマインダー設定
    if (notifSettings.enabled && notifSettings.dailyReminder && notifSettings.dailyReminderTime) {
      const [hour, minute] = notifSettings.dailyReminderTime.split(':').map(Number);
      await scheduleRepeatingNotification(
        2001, 
        '📚 学習開始のお知らせ', 
        `今日の目標: ${dailyGoalHours}時間\n学習を始めましょう！`, 
        hour, 
        minute
      );
    } else {
      await cancelNotification(2001);
    }

    // 夜間リマインダー設定
    if (notifSettings.enabled && notifSettings.eveningReminder && notifSettings.eveningReminderTime) {
      const [hour, minute] = notifSettings.eveningReminderTime.split(':').map(Number);
      await scheduleRepeatingNotification(
        2002, 
        '🌙 今日の学習進捗', 
        '今日の学習目標は達成できましたか？進捗を確認しましょう。', 
        hour, 
        minute
      );
    } else {
      await cancelNotification(2002);
    }
  };

  const ToggleRow = ({ 
    icon, 
    label, 
    description, 
    settingKey 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    description: string; 
    settingKey: keyof NotificationSettingsType;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-1">{icon}</div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{label}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <button
        onClick={() => handleToggle(settingKey)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          notifSettings[settingKey] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            notifSettings[settingKey] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

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

      {/* 通知の種類 */}
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-opacity duration-300 ${
        !notifSettings.enabled ? 'opacity-50 pointer-events-none grayscale' : ''
      }`}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">通知の種類</h3>
        
        <div className="space-y-0">
          <ToggleRow
            icon={<Clock className="text-orange-500" size={20} />}
            label="ポモドーロタイマー"
            description="集中時間と休憩時間を自動で切り替え"
            settingKey="pomodoroTimer"
          />
          
          <ToggleRow
            icon={<Clock className="text-blue-500" size={20} />}
            label="タイマー経過・完了通知"
            description="計測中の経過時間と完了を通知"
            settingKey="timerCompletion"
          />
          
          <ToggleRow
            icon={<AlertTriangle className="text-amber-500" size={20} />}
            label="長時間学習リマインダー"
            description="連続学習時に休憩を促す"
            settingKey="longStudyBreak"
          />
          
          <ToggleRow
            icon={<Target className="text-green-500" size={20} />}
            label="日次目標達成通知"
            description="今日の目標を達成したときに祝福"
            settingKey="dailyGoalAchievement"
          />
          
          <ToggleRow
            icon={<Bell className="text-purple-500" size={20} />}
            label="日次学習リマインダー"
            description="毎日設定した時刻に学習を促す"
            settingKey="dailyReminder"
          />
          
          <ToggleRow
            icon={<Moon className="text-indigo-500" size={20} />}
            label="夜間リマインダー"
            description="夜に未達成の場合にリマインド"
            settingKey="eveningReminder"
          />
          
          <ToggleRow
            icon={<Calendar className="text-red-500" size={20} />}
            label="期限警告"
            description="目標期限が近づいたときに警告"
            settingKey="deadlineWarning"
          />
        </div>
      </div>

      {/* ポモドーロ設定 */}
      {notifSettings.pomodoroTimer && (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-opacity duration-300 ${
          !notifSettings.enabled ? 'opacity-50 pointer-events-none grayscale' : ''
        }`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">ポモドーロタイマー設定</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                集中時間
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={notifSettings.pomodoroFocusMinutes}
                  onChange={(e) => handleNumberChange('pomodoroFocusMinutes', Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  min="1"
                  max="120"
                  style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">分</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                休憩時間
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={notifSettings.pomodoroBreakMinutes}
                  onChange={(e) => handleNumberChange('pomodoroBreakMinutes', Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  min="1"
                  max="60"
                  style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">分</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder times */}
      {(notifSettings.dailyReminder || notifSettings.eveningReminder || notifSettings.longStudyBreak) && (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-opacity duration-300 ${
          !notifSettings.enabled ? 'opacity-50 pointer-events-none grayscale' : ''
        }`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">リマインダー設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notifSettings.dailyReminder && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                日次リマインダー時刻
              </label>
              <input
                type="time"
                value={notifSettings.dailyReminderTime}
                onChange={(e) => handleTimeChange('dailyReminderTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
              />
            </div>
          )}
          
          {notifSettings.eveningReminder && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                夜間リマインダー時刻
              </label>
              <input
                type="time"
                value={notifSettings.eveningReminderTime}
                onChange={(e) => handleTimeChange('eveningReminderTime', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
              />
            </div>
          )}
          
          {notifSettings.longStudyBreak && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                長時間学習の基準時間
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={notifSettings.longStudyBreakMinutes}
                  onChange={(e) => handleNumberChange('longStudyBreakMinutes', Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  min="30"
                  max="240"
                  step="30"
                  style={{ colorScheme: settings.isDarkMode ? 'dark' : 'light' }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">分</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                この時間連続で学習すると休憩を促す通知が表示されます
              </p>
            </div>
          )}
        </div>
        </div>
      )}

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

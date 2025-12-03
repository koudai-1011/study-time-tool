import React from 'react';
import { Moon, Sun, Hand } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();

  const toggleDarkMode = () => {
    updateSettings({
      ...settings,
      isDarkMode: !settings.isDarkMode,
    });
  };

  const toggleSwipeNavigation = () => {
    updateSettings({
      ...settings,
      enableSwipeNavigation: !settings.enableSwipeNavigation,
    });
  };

  return (
    <div className="space-y-4">
      {/* ダークモード */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
            {settings.isDarkMode ? (
              <Moon className="text-indigo-600 dark:text-indigo-400" size={20} />
            ) : (
              <Sun className="text-amber-500" size={20} />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">ダークモード</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.isDarkMode ? '暗い配色で表示' : '明るい配色で表示'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            settings.isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              settings.isDarkMode ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* スワイプナビゲーション */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
            <Hand className="text-primary-600 dark:text-primary-400" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">スワイプ操作</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.enableSwipeNavigation !== false ? 'スワイプでタブ切り替え' : 'スワイプ無効'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleSwipeNavigation}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            settings.enableSwipeNavigation !== false ? 'bg-primary-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              settings.enableSwipeNavigation !== false ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        スワイプ操作を有効にすると、画面を左右にスワイプしてタブを切り替えられます（モバイル・タッチパッド対応）。
      </p>
    </div>
  );
};

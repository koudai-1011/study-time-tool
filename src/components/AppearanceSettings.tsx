import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();

  const toggleDarkMode = () => {
    updateSettings({
      ...settings,
      isDarkMode: !settings.isDarkMode,
    });
  };

  return (
    <div className="space-y-4">
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

      <p className="text-xs text-slate-500 dark:text-slate-400">
        ダークモードを有効にすると、目の疲れを軽減し、バッテリーを節約できます。
      </p>
    </div>
  );
};

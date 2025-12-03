import React from 'react';
import { BookOpen } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { DEFAULT_REVIEW_INTERVALS } from '../utils/reviewSchedule';

export const ReviewSettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  
  const reviewSettings = settings.reviewSettings || {
    enabled: false,
    intervals: DEFAULT_REVIEW_INTERVALS,
    notificationEnabled: false,
  };

  const handleToggle = (enabled: boolean) => {
    updateSettings({
      ...settings,
      reviewSettings: {
        ...reviewSettings,
        enabled,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-purple-500" size={20} />
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">復習機能</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              エビングハウスの忘却曲線に基づく復習管理
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggle(!reviewSettings.enabled)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            reviewSettings.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              reviewSettings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {reviewSettings.enabled && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            復習機能が有効になりました。「復習」タブから学習項目を追加できます。
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            復習間隔: 1日、3日、7日、14日、30日、60日
          </p>
        </div>
      )}
    </div>
  );
};

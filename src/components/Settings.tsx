import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { Save } from 'lucide-react';
import { CategorySettings } from './CategorySettings';
import { AccountSettings } from './AccountSettings';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  // Use string state so input can be empty instead of showing 0 initially
  const [targetHours, setTargetHours] = useState<string>(settings.targetHours > 0 ? String(settings.targetHours) : '');
  const [startDate, setStartDate] = useState(settings.startDate);
  const [endDate, setEndDate] = useState(settings.endDate);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setTargetHours(settings.targetHours > 0 ? String(settings.targetHours) : '');
    setStartDate(settings.startDate);
    setEndDate(settings.endDate);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetHours) || 0;
    updateSettings({ ...settings, targetHours: parsed, startDate, endDate });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">設定</h2>

      {/* Login Section */}
      <AccountSettings />

      {/* Settings Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              目標勉強時間 (合計)
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg"
                placeholder="例: 1000"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                時間
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              期限までに達成したい合計勉強時間を設定してください。
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              開始日
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg"
            />
            <p className="mt-2 text-sm text-slate-500">
              学習期間の開始日を設定してください。
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              終了日
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg"
            />
            <p className="mt-2 text-sm text-slate-500">
              学習期間の終了日（目標達成日）を設定してください。
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              デフォルトカテゴリ
            </label>
            <select
              value={settings.defaultCategoryId ?? 0}
              onChange={(e) => updateSettings({ ...settings, defaultCategoryId: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-lg"
            >
              {settings.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-500">
              タイマー起動時に初期選択されるカテゴリを設定してください。
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save size={20} />
              {isSaved ? '保存しました！' : '設定を保存'}
            </button>
          </div>
        </form>
      </div>

      {/* Category Settings */}
      <CategorySettings />
    </div>
  );
};

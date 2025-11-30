import React, { useState, useEffect } from 'react';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { Save, LogIn, LogOut } from 'lucide-react';
import { CategorySettings } from './CategorySettings';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  const { user, signInWithGoogle, logout } = useAuth();
  const [targetHours, setTargetHours] = useState(settings.targetHours);
  const [startDate, setStartDate] = useState(settings.startDate);
  const [endDate, setEndDate] = useState(settings.endDate);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setTargetHours(settings.targetHours);
    setStartDate(settings.startDate);
    setEndDate(settings.endDate);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ ...settings, targetHours, startDate, endDate });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">設定</h2>
      
      {/* Login Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">アカウント</h3>
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="font-medium text-slate-700">{user.displayName}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              <LogOut size={18} />
              ログアウト
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-4">Googleアカウントでログインすると、データをクラウドに保存できます。</p>
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
            >
              <LogIn size={20} />
              Googleでログイン
            </button>
          </div>
        )}
      </div>

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
                onChange={(e) => setTargetHours(Number(e.target.value))}
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

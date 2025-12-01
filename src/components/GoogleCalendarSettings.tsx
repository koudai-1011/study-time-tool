import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useStudy } from '../context/StudyContext';
import { createDailyStudyEvent } from '../utils/googleCalendar';
import { Calendar, Check, AlertCircle, Loader2 } from 'lucide-react';
import { parseISO, isSameDay } from 'date-fns';

export const GoogleCalendarSettings: React.FC = () => {
  const { logs, settings } = useStudy();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // 1. Re-authenticate to get access token
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      // 2. Filter logs for today
      const today = new Date();
      const todayLogs = logs.filter(log => isSameDay(parseISO(log.date), today));

      if (todayLogs.length === 0) {
        throw new Error('今日の学習記録がありません');
      }

      // 3. Create calendar event
      await createDailyStudyEvent(accessToken, today, todayLogs, settings.categories);

      setStatus('success');
    } catch (error: any) {
      console.error('Sync failed:', error);
      setStatus('error');
      setErrorMessage(error.message || '連携に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Googleカレンダー連携</h3>
      <p className="text-sm text-slate-500">
        今日の学習記録をGoogleカレンダーに送信します。<br />
        <span className="text-xs text-slate-400">※ボタンを押すとGoogleの認証画面が開きます。</span>
      </p>

      <div className="flex flex-col gap-4">
        <button
          onClick={handleSync}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-white transition-all ${
            isLoading
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95'
          }`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Calendar size={20} />
          )}
          今日の記録を送信
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <Check size={18} />
            送信しました！カレンダーを確認してください。
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

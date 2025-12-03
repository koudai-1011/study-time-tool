import React from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

export const AccountSettings: React.FC = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const dialog = useDialog();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      await dialog.alert('ログインに失敗しました。設定を確認してください。', { type: 'error' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 mb-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">アカウント</h3>
      {user ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full" />
            )}
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">{user.displayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Googleアカウントでログインすると、データをクラウドに保存できます。</p>
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
          >
            <LogIn size={20} />
            Googleでログイン
          </button>
        </div>
      )}
    </div>
  );
};

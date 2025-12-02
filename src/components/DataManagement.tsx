import React from 'react';
import { useStudy } from '../context/StudyContext';
import { Download, Upload, Trash2 } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const { settings, logs, setSettings, setLogs } = useStudy();

  const handleExport = () => {
    const data = { settings, logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) setSettings(data.settings);
        if (data.logs) setLogs(data.logs);
        alert('データをインポートしました');
      } catch (error) {
        alert('データの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      setLogs([]);
      alert('学習記録を削除しました');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">データ管理</h3>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div>
          <button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Download size={20} />
            データをエクスポート
          </button>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            設定と学習記録をJSONファイルとしてダウンロードします。
          </p>
        </div>

        <div>
          <label className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Upload size={20} />
            データをインポート
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            以前エクスポートしたデータファイルを読み込みます。
          </p>
        </div>

        <div>
          <button
            onClick={handleClearData}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            学習記録をクリア
          </button>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            すべての学習記録を削除します。設定は保持されます。
          </p>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTimeJapanese } from '../utils/timeFormat';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DayDetailModalProps {
  date: string; // ISO string
  onClose: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, onClose }) => {
  const { logs, settings, deleteLog, addLog } = useStudy();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDuration, setNewDuration] = useState({ hours: 0, minutes: 0 });
  const [newCategoryId, setNewCategoryId] = useState(0);

  const dayLogs = logs.filter(log => {
    const logDate = parseISO(log.date).toDateString();
    const targetDate = parseISO(date).toDateString();
    return logDate === targetDate;
  });

  const handleDelete = (logId: string) => {
    if (confirm('このログを削除しますか？')) {
      deleteLog(logId);
    }
  };

  const handleAddLog = () => {
    const totalSeconds = (newDuration.hours * 3600) + (newDuration.minutes * 60);
    if (totalSeconds > 0) {
      addLog(totalSeconds, newCategoryId, date);
      setNewDuration({ hours: 0, minutes: 0 });
      setShowAddForm(false);
    }
  };

  const totalDuration = dayLogs.reduce((acc, log) => acc + log.duration, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {format(parseISO(date), 'M月d日（E）', { locale: ja })}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              合計: {formatTimeJapanese(totalDuration / 3600)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dayLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">この日の記録はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayLogs.map(log => {
                const category = settings.categories.find(c => c.id === log.categoryId);
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: category?.color }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{category?.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatTimeJapanese(log.duration / 3600)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Log Form */}
          {showAddForm ? (
            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <h3 className="font-semibold text-slate-800 mb-4">記録を追加</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    カテゴリー
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {settings.categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setNewCategoryId(category.id)}
                        className={`p-3 rounded-lg transition-all ${
                          newCategoryId === category.id
                            ? 'ring-4 ring-primary-600 scale-110'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: category.color }}
                        title={category.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      時間
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newDuration.hours}
                      onChange={(e) => setNewDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      分
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newDuration.minutes}
                      onChange={(e) => setNewDuration(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddLog}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mt-6 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-slate-600 hover:text-primary-600"
            >
              <Plus size={20} />
              記録を追加
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

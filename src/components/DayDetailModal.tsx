import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [newDuration, setNewDuration] = useState({ hours: '', minutes: '' });
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
    const hours = parseInt(String(newDuration.hours)) || 0;
    const minutes = parseInt(String(newDuration.minutes)) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    if (totalSeconds > 0) {
      addLog(totalSeconds, newCategoryId, date);
      setNewDuration({ hours: '', minutes: '' });
      setShowAddForm(false);
    }
  };

  const totalDuration = dayLogs.reduce((acc, log) => acc + log.duration, 0);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {format(parseISO(date), 'M月d日（E）', { locale: ja })}
            </h2>
            <motion.p
              className="text-sm text-slate-500 mt-1"
              key={totalDuration}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              合計: {formatTimeJapanese(totalDuration / 3600)}
            </motion.p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} className="text-slate-600" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="popLayout">
            {dayLogs.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-slate-400">この日の記録はありません</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {dayLogs.map((log, index) => {
                  const category = settings.categories.find(c => c.id === log.categoryId);
                  return (
                    <motion.div
                      key={log.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <motion.div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category?.color }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{category?.name}</p>
                        <p className="text-sm text-slate-500">
                          {formatTimeJapanese(log.duration / 3600)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleDelete(log.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        title="削除"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Add Log Form */}
          <AnimatePresence>
            {showAddForm ? (
              <motion.div
                className="mt-6 p-4 bg-primary-50 rounded-xl"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="font-semibold text-slate-800 mb-4">記録を追加</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      カテゴリー
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {settings.categories.map(category => (
                        <motion.button
                          key={category.id}
                          type="button"
                          onClick={() => setNewCategoryId(category.id)}
                          className={`p-3 rounded-lg transition-all ${newCategoryId === category.id
                              ? 'ring-4 ring-primary-600'
                              : 'opacity-60 hover:opacity-100'
                            }`}
                          style={{ backgroundColor: category.color }}
                          title={category.name}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
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
                        onChange={(e) => setNewDuration(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                        placeholder="例: 1"
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
                        onChange={(e) => setNewDuration(prev => ({ ...prev, minutes: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none"
                        placeholder="例: 30"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleAddLog}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      追加
                    </motion.button>
                    <motion.button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      キャンセル
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors text-slate-600 hover:text-primary-600"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus size={20} />
                記録を追加
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

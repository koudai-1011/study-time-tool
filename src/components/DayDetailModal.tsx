import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { formatTimeJapanese } from '../utils/timeFormat';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { StudyLog } from '../types';
import { ClockPicker } from './ClockPicker';

interface DayDetailModalProps {
  date: string; // ISO string
  onClose: () => void;
}

interface GroupedLog {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  totalDuration: number;
  logs: StudyLog[];
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, onClose }) => {
  const { logs, settings, deleteLog, addLog } = useStudy();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDuration, setNewDuration] = useState({ hours: '', minutes: '' });
  const [newCategoryId, setNewCategoryId] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const dayLogs = logs.filter(log => {
    const logDate = parseISO(log.date).toDateString();
    const targetDate = parseISO(date).toDateString();
    return logDate === targetDate;
  });

  // Group logs by category
  const groupedLogs: GroupedLog[] = [];
  const categoryMap = new Map<number, GroupedLog>();

  dayLogs.forEach(log => {
    const category = settings.categories.find(c => c.id === log.categoryId);
    if (!category) return;

    if (!categoryMap.has(log.categoryId)) {
      const group: GroupedLog = {
        categoryId: log.categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        totalDuration: 0,
        logs: []
      };
      categoryMap.set(log.categoryId, group);
      groupedLogs.push(group);
    }

    const group = categoryMap.get(log.categoryId)!;
    group.totalDuration += log.duration;
    group.logs.push(log);
  });

  // Sort logs within each group by date
  groupedLogs.forEach(group => {
    group.logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

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
      // Create end time as end of the selected day
      const selectedDate = parseISO(date);
      const endTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23,
        59,
        59,
        999
      );
      addLog(totalSeconds, newCategoryId, endTime.toISOString());
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
            {groupedLogs.length === 0 ? (
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
                {groupedLogs.map((group, index) => {
                  const isExpanded = expandedCategories.has(group.categoryId);
                  return (
                    <motion.div
                      key={group.categoryId}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      {/* Category Group Header */}
                      <motion.div
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => toggleCategory(group.categoryId)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: group.categoryColor }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 mb-1">
                            {group.categoryName}
                          </div>
                          <p className="text-sm text-slate-500">
                            {formatTimeJapanese(group.totalDuration / 3600)}
                            {group.logs.length > 1 && (
                              <span className="ml-2 text-xs">
                                ({group.logs.length}回)
                              </span>
                            )}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={20} className="text-slate-400" />
                        </motion.div>
                      </motion.div>

                      {/* Expanded Individual Logs */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 mt-2 space-y-2"
                          >
                            {group.logs.map((log, logIndex) => {
                              const logTime = parseISO(log.date);
                              const endTime = new Date(logTime.getTime());
                              const startTime = new Date(endTime.getTime() - log.duration * 1000);
                              
                              return (
                                <motion.div
                                  key={log.id}
                                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  transition={{ delay: logIndex * 0.03 }}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <span className="font-medium">
                                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-slate-500">
                                        {formatTimeJapanese(log.duration / 3600)}
                                      </span>
                                    </div>
                                  </div>
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(log.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                    title="削除"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {settings.categories.map(category => (
                        <motion.button
                          key={category.id}
                          type="button"
                          onClick={() => setNewCategoryId(category.id)}
                          className={`p-3 rounded-lg transition-all ${newCategoryId === category.id
                              ? 'ring-4 ring-primary-600 scale-110'
                              : 'opacity-60 hover:opacity-100'
                            }`}
                          style={{ backgroundColor: category.color }}
                          title={category.name}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      ))}
                    </div>
                    {/* Selected Category Name */}
                    <div className="text-center py-2 px-4 bg-white rounded-lg border-2 border-primary-200">
                      <span className="text-sm font-medium text-slate-600">選択中: </span>
                      <span className="text-base font-bold text-primary-600">
                        {settings.categories.find(c => c.id === newCategoryId)?.name || 'カテゴリーを選択'}
                      </span>
                    </div>
                  </div>



                  {/* Modern Time Input */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      学習時間
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      {/* Hours Input (Counter) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">時間</span>
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 w-32 flex flex-col items-center shadow-sm">
                          <motion.button
                            type="button"
                            onClick={() => {
                              const current = parseInt(String(newDuration.hours)) || 0;
                              setNewDuration(prev => ({ ...prev, hours: String(current + 1) }));
                            }}
                            className="w-full bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg p-2 transition-colors"
                            whileTap={{ scale: 0.95 }}
                          >
                            ▲
                          </motion.button>
                          <div className="text-4xl font-bold text-slate-800 my-2 tabular-nums">
                            {newDuration.hours || '0'}
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => {
                              const current = parseInt(String(newDuration.hours)) || 0;
                              if (current > 0) setNewDuration(prev => ({ ...prev, hours: String(current - 1) }));
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg p-2 transition-colors"
                            whileTap={{ scale: 0.95 }}
                          >
                            ▼
                          </motion.button>
                        </div>
                      </div>

                      {/* Minutes Input (Clock Widget) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">分</span>
                        <div className="bg-white rounded-full border-2 border-slate-100 shadow-sm p-1">
                          <ClockPicker 
                            value={parseInt(String(newDuration.minutes)) || 0}
                            onChange={(val: number) => setNewDuration(prev => ({ ...prev, minutes: String(val) }))}
                            size={200}
                          />
                        </div>
                      </div>
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

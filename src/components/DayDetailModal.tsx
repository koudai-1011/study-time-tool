import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useDialog } from '../context/DialogContext';
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
  const { logs, settings, deleteLog, addLog, updateLog, setIsSwipeEnabled } = useStudy();
  const dialog = useDialog();
  
  // Disable global swipe navigation when modal is open
  useEffect(() => {
    setIsSwipeEnabled(false);
    return () => setIsSwipeEnabled(true);
  }, [setIsSwipeEnabled]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDuration, setNewDuration] = useState({ hours: '', minutes: '' });
  const [newCategoryId, setNewCategoryId] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<{ hours: string; minutes: string }>({ hours: '', minutes: '' });
  const [editStartTime, setEditStartTime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });

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

  const handleDelete = async (logId: string) => {
    if (await dialog.confirm('ログを削除', {
      message: 'この学習記録を削除してもよろしいですか？',
      type: 'warning',
      confirmText: '削除',
      confirmColor: 'danger'
    })) {
      deleteLog(logId);
    }
  };

  const handleAddLog = () => {
    const hours = parseInt(String(newDuration.hours)) || 0;
    const minutes = parseInt(String(newDuration.minutes)) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    if (totalSeconds > 0) {
      // Use current time or end of day if current time is not on the selected date
      const selectedDate = parseISO(date);
      const now = new Date();
      const isToday = now.toDateString() === selectedDate.toDateString();
      
      const endTime = isToday 
        ? now  // Current time for today
        : new Date(  // End of day for past dates
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

  const handleStartEdit = (log: StudyLog) => {
    setEditingLogId(log.id);
    setEditCategory(log.categoryId);
    
    // Calculate start and end time
    const logTime = parseISO(log.date);
    const endTime = new Date(logTime.getTime());
    const startTime = new Date(endTime.getTime() - log.duration * 1000);
    
    // Set start time
    setEditStartTime({
      hours: startTime.getHours(),
      minutes: startTime.getMinutes()
    });
    
    // Set duration
    const durationHours = Math.floor(log.duration / 3600);
    const durationMinutes = Math.floor((log.duration % 3600) / 60);
    setEditDuration({
      hours: String(durationHours),
      minutes: String(durationMinutes)
    });
  };

  const handleSaveEdit = (logId: string) => {
    const selectedDate = parseISO(date);
    
    // Calculate new end time from start time + duration
    const hours = parseInt(String(editDuration.hours)) || 0;
    const minutes = parseInt(String(editDuration.minutes)) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    
    const newStartTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      editStartTime.hours,
      editStartTime.minutes,
      0,
      0
    );
    
    const newEndTime = new Date(newStartTime.getTime() + totalSeconds * 1000);
    
    updateLog(logId, {
      categoryId: editCategory,
      date: newEndTime.toISOString(),
      duration: totalSeconds
    });
    setEditingLogId(null);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
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
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {format(parseISO(date), 'M月d日（E）', { locale: ja })}
            </h2>
            <motion.p
              className="text-sm text-slate-500 dark:text-slate-400 mt-1"
              key={totalDuration}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              合計: {formatTimeJapanese(totalDuration / 3600)}
            </motion.p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} className="text-slate-600 dark:text-slate-400" />
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
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                            {group.categoryName}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
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
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: logIndex * 0.03 }}
                                    layout
                                  >
                                    {/* Log Display / Edit Mode */}
                                    {editingLogId === log.id ? (
                                      /* Edit Mode */
                                      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">記録を編集</h4>

                                        {/* Category Selection */}
                                        <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            カテゴリー
                                          </label>
                                          <div className="grid grid-cols-5 gap-2 mb-3">
                                            {settings.categories.map(category => (
                                              <motion.button
                                                key={category.id}
                                                type="button"
                                                onClick={() => setEditCategory(category.id)}
                                                className={`p-3 rounded-lg transition-all ${editCategory === category.id
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
                                          <div className="text-center py-2 px-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-primary-200 dark:border-primary-900">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">選択中: </span>
                                            <span className="text-base font-bold text-primary-600">
                                              {settings.categories.find(c => c.id === editCategory)?.name || 'カテゴリーを選択'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Start Time Input */}
                                        <div>
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            開始時刻
                                          </label>
                                          <div className="flex gap-2">
                                            <input
                                              type="number"
                                              min="0"
                                              max="23"
                                              value={editStartTime.hours}
                                              onChange={(e) => setEditStartTime({ ...editStartTime, hours: parseInt(e.target.value) || 0 })}
                                              className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-center text-2xl font-bold text-slate-800 dark:text-slate-100"
                                              placeholder="時"
                                            />
                                            <span className="flex items-center text-2xl font-bold text-slate-400">:</span>
                                            <input
                                              type="number"
                                              min="0"
                                              max="59"
                                              value={editStartTime.minutes}
                                              onChange={(e) => setEditStartTime({ ...editStartTime, minutes: parseInt(e.target.value) || 0 })}
                                              className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-center text-2xl font-bold text-slate-800 dark:text-slate-100"
                                              placeholder="分"
                                            />
                                          </div>
                                        </div>

                                        {/* Duration Input */}
                                        <div className="space-y-4">
                                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            学習時間
                                          </label>
                                          
                                          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                                            {/* Hours Input (Counter) */}
                                            <div className="flex flex-col items-center gap-2">
                                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">時間</span>
                                              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-600 p-4 w-32 flex flex-col items-center shadow-sm">
                                                <motion.button
                                                  type="button"
                                                  onClick={() => {
                                                    const current = parseInt(String(editDuration.hours)) || 0;
                                                    setEditDuration(prev => ({ ...prev, hours: String(current + 1) }));
                                                  }}
                                                  className="w-full bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg p-2 transition-colors"
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  ▲
                                                </motion.button>
                                                <div className="text-4xl font-bold text-slate-800 dark:text-slate-100 my-2 tabular-nums">
                                                  {editDuration.hours || '0'}
                                                </div>
                                                <motion.button
                                                  type="button"
                                                  onClick={() => {
                                                    const current = parseInt(String(editDuration.hours)) || 0;
                                                    if (current > 0) setEditDuration(prev => ({ ...prev, hours: String(current - 1) }));
                                                  }}
                                                  className="w-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-lg p-2 transition-colors"
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  ▼
                                                </motion.button>
                                              </div>
                                            </div>

                                            {/* Minutes Input (Clock Widget) */}
                                            <div className="flex flex-col items-center gap-2">
                                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">分</span>
                                              <div className="bg-white dark:bg-slate-800 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm p-1">
                                                <ClockPicker 
                                                  value={parseInt(String(editDuration.minutes)) || 0}
                                                  onChange={(val: number) => setEditDuration(prev => ({ ...prev, minutes: String(val) }))}
                                                  size={200}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Save/Cancel Buttons */}
                                        <div className="flex gap-2">
                                          <motion.button
                                            onClick={() => handleSaveEdit(log.id)}
                                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                          >
                                            保存
                                          </motion.button>
                                          <motion.button
                                            onClick={handleCancelEdit}
                                            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                          >
                                            キャンセル
                                          </motion.button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Display Mode */
                                      <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
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
                                            handleStartEdit(log);
                                          }}
                                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                          title="編集"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                          </svg>
                                        </motion.button>
                                        <motion.button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(log.id);
                                          }}
                                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                          title="削除"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <Trash2 size={16} />
                                        </motion.button>
                                      </div>
                                    )}
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
                className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">記録を追加</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    <div className="text-center py-2 px-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-primary-200 dark:border-primary-900">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">選択中: </span>
                      <span className="text-base font-bold text-primary-600">
                        {settings.categories.find(c => c.id === newCategoryId)?.name || 'カテゴリーを選択'}
                      </span>
                    </div>
                  </div>



                  {/* Modern Time Input */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      学習時間
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      {/* Hours Input (Counter) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">時間</span>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-600 p-4 w-32 flex flex-col items-center shadow-sm">
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
                          <div className="text-4xl font-bold text-slate-800 dark:text-slate-100 my-2 tabular-nums">
                            {newDuration.hours || '0'}
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => {
                              const current = parseInt(String(newDuration.hours)) || 0;
                              if (current > 0) setNewDuration(prev => ({ ...prev, hours: String(current - 1) }));
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-lg p-2 transition-colors"
                          whileTap={{ scale: 0.95 }}
                        >
                            ▼
                          </motion.button>
                        </div>
                      </div>

                      {/* Minutes Input (Clock Widget) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">分</span>
                        <div className="bg-white dark:bg-slate-800 rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm p-1">
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
                      className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors"
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
                className="w-full mt-6 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Tag, HelpCircle } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface ReviewSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewSuggestionModal: React.FC<ReviewSuggestionModalProps> = ({ isOpen, onClose }) => {
  const { settings, suggestions, addSuggestion, deleteSuggestion } = useStudy();
  const [newContent, setNewContent] = useState('');
  const [categoryId, setCategoryId] = useState(settings.categories[0]?.id || 0);
  const [showHelp, setShowHelp] = useState(false);
  const [useRange, setUseRange] = useState(false);
  const [unit, setUnit] = useState('');

  const handleAdd = () => {
    if (newContent.trim()) {
      addSuggestion(newContent.trim(), categoryId, useRange, unit.trim());
      setNewContent('');
      setUseRange(false);
      setUnit('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-primary-500" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  サジェスト設定
                </h3>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="ml-2 text-slate-400 hover:text-primary-500 transition-colors"
                  title="サジェストとは？"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {/* ヘルプ表示 */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
                  >
                    <div className="p-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                      <p className="font-bold text-primary-700 dark:text-primary-300">💡 サジェスト機能とは？</p>
                      <p>
                        よく使う学習項目（例：「英単語帳」「数学の問題集」など）を登録しておくと、
                        入力欄の下にボタンとして表示され、ワンタップで入力できるようになります。
                      </p>
                      <div className="flex items-center gap-2 mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">英単語</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-xs">タップで入力完了！</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        ※「範囲入力」をONにすると、タップ時に開始・終了番号を入力できるようになります。
                        （例：ターゲット1900 → 1〜100）
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 追加フォーム */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  新しいサジェストを追加
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                      {settings.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="例：英単語"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm min-w-0"
                      />
                    </div>
                  </div>

                  {/* 範囲入力設定 */}
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useRange}
                        onChange={(e) => setUseRange(e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">範囲入力を利用</span>
                    </label>
                    
                    {useRange && (
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="単位 (例: p, No.)"
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm"
                      />
                    )}
                  </div>

                  <button
                    onClick={handleAdd}
                    disabled={!newContent.trim()}
                    className="w-full p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    追加
                  </button>
                </div>
              </div>

              {/* リスト */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  登録済みサジェスト
                </label>
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 text-sm">登録されたサジェストはありません</p>
                    <p className="text-xs text-slate-400 mt-1">上のフォームから追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map(suggestion => {
                      const category = settings.categories.find(c => c.id === suggestion.categoryId);
                      return (
                        <div key={suggestion.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: category?.color }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-slate-700 dark:text-slate-200 truncate font-medium">
                                {suggestion.content}
                              </span>
                              {suggestion.useRange && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  範囲入力あり {suggestion.unit && `(単位: ${suggestion.unit})`}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSuggestion(suggestion.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Tag, HelpCircle, ChevronDown } from 'lucide-react';
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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [unitPosition, setUnitPosition] = useState<'before' | 'after'>('after'); // 単位の位置

  const handleAdd = () => {
    if (newContent.trim()) {
      // 単位の位置を保存（unitの先頭に*を付けると前置き）
      const unitWithPosition = useRange && unit.trim() ? (unitPosition === 'before' ? `*${unit.trim()}` : unit.trim()) : '';
      addSuggestion(newContent.trim(), categoryId, useRange, unitWithPosition);
      setNewContent('');
      setUseRange(false);
      setUnit('');
      setUnitPosition('after');
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
                  <div className="flex flex-col sm:flex-row gap-2 relative z-20">
                    <div className="relative">
                      <button
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: settings.categories.find(c => c.id === categoryId)?.color }}
                          />
                          <span className="text-slate-700 dark:text-slate-200 truncate">
                            {settings.categories.find(c => c.id === categoryId)?.name}
                          </span>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={`text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isCategoryOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsCategoryOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 mt-2 w-full sm:w-56 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 max-h-60 overflow-y-auto"
                            >
                              {settings.categories.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    setCategoryId(c.id);
                                    setIsCategoryOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                    categoryId === c.id
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: c.color }}
                                  />
                                  <span className={`text-sm flex-1 text-left ${
                                    categoryId === c.id
                                      ? 'font-bold text-primary-700 dark:text-primary-300'
                                      : 'font-medium text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {c.name}
                                  </span>
                                  {categoryId === c.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

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
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg space-y-3">
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
                      <div className="flex flex-col gap-2 pl-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder="単位 (例: p, No.)"
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">位置:</span>
                          <button
                            type="button"
                            onClick={() => setUnitPosition('before')}
                            className={`px-2 py-1 text-xs rounded ${unitPosition === 'before' ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                          >
                            前 (p.1〜10)
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnitPosition('after')}
                            className={`px-2 py-1 text-xs rounded ${unitPosition === 'after' ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                          >
                            後 (1〜10p.)
                          </button>
                        </div>
                      </div>
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

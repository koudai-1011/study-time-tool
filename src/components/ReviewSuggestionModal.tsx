import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

interface ReviewSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewSuggestionModal: React.FC<ReviewSuggestionModalProps> = ({ isOpen, onClose }) => {
  const { settings, suggestions, addSuggestion, deleteSuggestion } = useStudy();
  const [newContent, setNewContent] = useState('');
  const [categoryId, setCategoryId] = useState(settings.categories[0]?.id || 0);

  const handleAdd = () => {
    if (newContent.trim()) {
      addSuggestion(newContent.trim(), categoryId);
      setNewContent('');
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tag size={20} className="text-primary-500" />
                サジェスト設定
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* 追加フォーム */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  新しいサジェストを追加
                </label>
                <div className="flex gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                  >
                    {settings.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="例：英単語"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newContent.trim()}
                    className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* リスト */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  登録済みサジェスト
                </label>
                {suggestions.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">登録されたサジェストはありません</p>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map(suggestion => {
                      const category = settings.categories.find(c => c.id === suggestion.categoryId);
                      return (
                        <div key={suggestion.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category?.color }}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{suggestion.content}</span>
                          </div>
                          <button
                            onClick={() => deleteSuggestion(suggestion.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
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

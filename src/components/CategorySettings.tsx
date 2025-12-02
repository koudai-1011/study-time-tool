import { useState, useEffect } from 'react';
import { useStudy, type Category } from '../context/StudyContext';
import { Save } from 'lucide-react';

export const CategorySettings: React.FC = () => {
  const { settings, updateSettings } = useStudy();
  const [categories, setCategories] = useState<Category[]>(settings.categories);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setCategories(settings.categories);
  }, [settings.categories]);

  const handleCategoryNameChange = (id: number, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ ...settings, categories });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">カテゴリー設定</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        学習カテゴリーの名前を編集できます。色は固定です。
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <input
                type="text"
                value={category.name}
                onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                placeholder={`カテゴリー${category.id + 1}`}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/30 transition-all active:scale-95"
        >
          <Save size={20} />
          {isSaved ? '保存しました！' : '保存'}
        </button>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Smartphone, BookOpen, Database } from 'lucide-react';
import { AccountSettings } from './AccountSettings';
import { CategorySettings } from './CategorySettings';
import { GoalSettings } from './GoalSettings';
import { DataManagement } from './DataManagement';
import { DashboardSettings } from './DashboardSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { ReviewSettings } from './ReviewSettings';
// import { GoogleCalendarSettings } from './GoogleCalendarSettings'; // 凍結中

type SettingSection = 'account' | 'appearance' | 'dashboard' | 'notification' | 'review' | 'category' | 'goal' | 'data';

interface SettingGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  sections: { id: SettingSection; title: string; component: React.ReactNode }[];
}

const settingGroups: SettingGroup[] = [
  {
    id: 'general',
    title: '一般設定',
    icon: <Smartphone size={18} />,
    sections: [
      { id: 'account', title: 'アカウント設定', component: <AccountSettings /> },
      { id: 'appearance', title: '外観設定', component: <AppearanceSettings /> },
      { id: 'dashboard', title: 'ダッシュボード設定', component: <DashboardSettings /> },
      { id: 'notification', title: '通知設定', component: <NotificationSettings /> },
    ],
  },
  {
    id: 'study',
    title: '学習設定',
    icon: <BookOpen size={18} />,
    sections: [
      { id: 'review', title: '復習設定', component: <ReviewSettings /> },
      { id: 'category', title: 'カテゴリ設定', component: <CategorySettings /> },
      { id: 'goal', title: '目標設定', component: <GoalSettings /> },
    ],
  },
  {
    id: 'data',
    title: 'データ管理',
    icon: <Database size={18} />,
    sections: [
      { id: 'data', title: 'データ管理', component: <DataManagement /> },
    ],
  },
];

export const Settings: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<SettingSection>>(new Set());

  const toggleSection = (sectionId: SettingSection) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">設定</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">アプリの各種設定を行います。</p>
      </header>

      {settingGroups.map((group) => (
        <div key={group.id} className="space-y-3">
          {/* グループヘッダー */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-primary-600 dark:text-primary-400">{group.icon}</span>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {group.title}
            </h3>
          </div>

          {/* グループ内のセクション */}
          <div className="space-y-2">
            {group.sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              return (
                <motion.div
                  key={section.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
                  initial={false}
                >
                  {/* Accordion Header */}
                  <motion.button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    whileTap={{ scale: 0.99 }}
                  >
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{section.title}</h4>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-slate-400 dark:text-slate-500" />
                    </motion.div>
                  </motion.button>

                  {/* Accordion Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                          {section.component}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

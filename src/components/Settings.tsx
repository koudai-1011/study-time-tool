import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AccountSettings } from './AccountSettings';
import { CategorySettings } from './CategorySettings';
import { GoalSettings } from './GoalSettings';
import { DataManagement } from './DataManagement';
import { DashboardSettings } from './DashboardSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
// import { GoogleCalendarSettings } from './GoogleCalendarSettings'; // 凍結中

type SettingSection = 'account' | 'appearance' | 'dashboard' | 'notification' | 'category' | 'goal' | 'data';

const settingSections: { id: SettingSection; title: string; component: React.ReactNode }[] = [
  { id: 'account', title: 'アカウント設定', component: <AccountSettings /> },
  { id: 'appearance', title: '外観設定', component: <AppearanceSettings /> },
  { id: 'dashboard', title: 'ダッシュボード設定', component: <DashboardSettings /> },
  { id: 'notification', title: '通知設定', component: <NotificationSettings /> },
  { id: 'category', title: 'カテゴリ設定', component: <CategorySettings /> },
  { id: 'goal', title: '目標設定', component: <GoalSettings /> },
  // { id: 'calendar', title: 'Googleカレンダー連携', component: <GoogleCalendarSettings /> }, // 凍結中
  { id: 'data', title: 'データ管理', component: <DataManagement /> },
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
    <div className="space-y-4 pb-20 md:pb-0">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">設定</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">アプリの各種設定を行います。</p>
      </header>

      <div className="space-y-3">
        {settingSections.map((section) => {
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
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
                whileTap={{ scale: 0.99 }}
              >
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{section.title}</h3>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} className="text-slate-400 dark:text-slate-500" />
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
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700">
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
  );
};

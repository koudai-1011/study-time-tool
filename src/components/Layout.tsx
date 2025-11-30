import React from 'react';
import { LayoutDashboard, Calendar, Settings as SettingsIcon, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'calendar' | 'settings';
  onTabChange: (tab: 'dashboard' | 'calendar' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <Clock className="w-8 h-8" />
            StudyTime
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="ダッシュボード" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')}
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="カレンダー" 
            isActive={activeTab === 'calendar'} 
            onClick={() => onTabChange('calendar')}
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label="設定" 
            isActive={activeTab === 'settings'} 
            onClick={() => onTabChange('settings')}
          />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          StudyTime
        </h1>
        {/* Simple mobile nav could go here, for now relying on bottom bar or similar if needed, but let's keep it simple */}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-20 md:pb-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-10 pb-safe">
        <MobileNavItem 
          icon={<LayoutDashboard size={24} />} 
          label="ホーム" 
          isActive={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')}
        />
        <MobileNavItem 
          icon={<Calendar size={24} />} 
          label="カレンダー" 
          isActive={activeTab === 'calendar'} 
          onClick={() => onTabChange('calendar')}
        />
        <MobileNavItem 
          icon={<SettingsIcon size={24} />} 
          label="設定" 
          isActive={activeTab === 'settings'} 
          onClick={() => onTabChange('settings')}
        />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
      isActive 
        ? "bg-primary-50 text-primary-700 shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1",
      isActive ? "text-primary-600" : "text-slate-400"
    )}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

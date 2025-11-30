import { useSwipeable } from 'react-swipeable';
import { LayoutDashboard, Calendar, Settings as SettingsIcon, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'calendar' | 'settings';
  onTabChange: (tab: 'dashboard' | 'calendar' | 'settings') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs: Array<'dashboard' | 'calendar' | 'settings'> = ['dashboard', 'calendar', 'settings'];
  const currentIndex = tabs.indexOf(activeTab);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1]);
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <div className=\"min-h-screen bg-slate-50 flex\">
      {/* Sidebar */}
      <aside className=\"hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shadow-sm\">
        <div className=\"p-6 border-b border-slate-100\">
          <div className=\"flex items-center gap-2\">
            <Clock className=\"text-primary-600\" size={28} />
            <h1 className=\"text-xl font-bold text-slate-800\">学習記録</h1>
          </div>
        </div>

        <nav className=\"flex-1 p-4 space-y-2\">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label=\"ホーム\" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')}
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label=\"カレンダー\" 
            isActive={activeTab === 'calendar'} 
            onClick={() => onTabChange('calendar')}
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label=\"設定\" 
            isActive={activeTab === 'settings'} 
            onClick={() => onTabChange('settings')}
          />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className=\"md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 shadow-sm z-10 flex items-center justify-center\">
        <div className=\"flex items-center gap-2\">
          <Clock className=\"text-primary-600\" size={24} />
          <h1 className=\"text-lg font-bold text-slate-800\">学習記録</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className=\"flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-20 md:pb-8 overflow-auto\" {...handlers}>
        <div className=\"max-w-5xl mx-auto\">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className=\"md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-lg flex items-center justify-around px-4 pb-safe\">
        <MobileNavItem 
          icon={<LayoutDashboard size={24} />} 
          label=\"ホーム\" 
          isActive={activeTab === 'dashboard'} 
          onClick={() => onTabChange('dashboard')}
        />
        <MobileNavItem 
          icon={<Calendar size={24} />} 
          label=\"カレンダー\" 
          isActive={activeTab === 'calendar'} 
          onClick={() => onTabChange('calendar')}
        />
        <MobileNavItem 
          icon={<SettingsIcon size={24} />} 
          label=\"設定\" 
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
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
      isActive
        ? 'bg-primary-50 text-primary-700 shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
      'flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all',
      isActive
        ? 'text-primary-600'
        : 'text-slate-400'
    )}
  >
    {icon}
    <span className=\"text-xs font-medium\">{label}</span>
  </button>
);

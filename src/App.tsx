import { useState, useEffect } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HistoryScreen } from './components/HistoryScreen';
import { Settings } from './components/Settings';

// Component to handle dark mode class
const DarkModeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStudy();

  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  return <>{children}</>;
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'settings'>('dashboard');

  // Global: disable copy across the app (allow paste)
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      // Prevent copy action
      e.preventDefault();
      // Optionally clear any selection to discourage copying
      try {
        const sel = window.getSelection();
        sel?.removeAllRanges();
      } catch (err) {
        // ignore
      }
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, []);

  return (
    <AuthProvider>
      <StudyProvider>
        <DarkModeWrapper>
          <Layout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'calendar' && <HistoryScreen />}
            {activeTab === 'settings' && <Settings />}
          </Layout>
        </DarkModeWrapper>
      </StudyProvider>
    </AuthProvider>
  );
}

export default App;

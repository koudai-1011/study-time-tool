import { useState } from 'react';
import { useEffect } from 'react';
import { StudyProvider } from './context/StudyContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { Settings } from './components/Settings';

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
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'settings' && <Settings />}
        </Layout>
      </StudyProvider>
    </AuthProvider>
  );
}

export default App;

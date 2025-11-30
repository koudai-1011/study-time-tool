import { useState } from 'react';
import { StudyProvider } from './context/StudyContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { Settings } from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'settings'>('dashboard');

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

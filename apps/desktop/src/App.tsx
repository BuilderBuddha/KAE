import { useState } from 'react';
import { Shell } from './components/Shell';
import { NavigationProvider } from './context/NavigationContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ExplorerScreen } from './screens/ExplorerScreen';
import { SearchScreen } from './screens/SearchScreen';
import { RepositorySettingsScreen } from './screens/RepositorySettingsScreen';
import { JobQueueScreen } from './screens/JobQueueScreen';
import { LogsScreen } from './screens/LogsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type { ScreenId } from './types/navigation';

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'import':
      return <ImportScreen />;
    case 'explorer':
      return <ExplorerScreen />;
    case 'search':
      return <SearchScreen />;
    case 'repository':
      return <RepositorySettingsScreen />;
    case 'jobs':
      return <JobQueueScreen />;
    case 'logs':
      return <LogsScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');

  return (
    <NavigationProvider onNavigate={setActiveScreen}>
      <Shell activeScreen={activeScreen} onNavigate={setActiveScreen}>
        {renderScreen(activeScreen)}
      </Shell>
    </NavigationProvider>
  );
}

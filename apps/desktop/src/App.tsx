import { useState } from 'react';
import { Shell } from './components/Shell';
import { NavigationProvider } from './context/NavigationContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ExplorerScreen } from './screens/ExplorerScreen';
import { SearchScreen } from './screens/SearchScreen';
import { VigsyScreen } from './screens/VigsyScreen';
import { RepositorySettingsScreen } from './screens/RepositorySettingsScreen';
import { JobQueueScreen } from './screens/JobQueueScreen';
import { LogsScreen } from './screens/LogsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ConnectorManagerScreen } from './screens/ConnectorManagerScreen';
import { VigsyConversationProvider } from './context/VigsyConversationContext';
import type { ScreenId } from './types/navigation';

function renderScreen(screen: ScreenId) {
  switch (screen) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'import':
      return <ImportScreen />;
    case 'connectors':
      return <ConnectorManagerScreen />;
    case 'explorer':
      return <ExplorerScreen />;
    case 'search':
      return <SearchScreen />;
    case 'vigsy':
      return <VigsyScreen />;
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
  const [activeScreen, setActiveScreen] = useState<ScreenId>('vigsy');

  return (
    <NavigationProvider onNavigate={setActiveScreen}>
      <VigsyConversationProvider>
        <Shell activeScreen={activeScreen} onNavigate={setActiveScreen}>
          {renderScreen(activeScreen)}
        </Shell>
      </VigsyConversationProvider>
    </NavigationProvider>
  );
}

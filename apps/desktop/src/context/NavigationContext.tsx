import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { ScreenId } from '../types/navigation';

interface NavigationContextValue {
  navigate: (screen: ScreenId) => void;
  explorerTargetPath: string | null;
  openInExplorer: (relativePath: string) => void;
  clearExplorerTarget: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  onNavigate,
  children,
}: {
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}) {
  const [explorerTargetPath, setExplorerTargetPath] = useState<string | null>(null);

  const openInExplorer = useCallback(
    (relativePath: string) => {
      setExplorerTargetPath(relativePath);
      onNavigate('explorer');
    },
    [onNavigate],
  );

  const clearExplorerTarget = useCallback(() => setExplorerTargetPath(null), []);

  return (
    <NavigationContext.Provider
      value={{
        navigate: onNavigate,
        explorerTargetPath,
        openInExplorer,
        clearExplorerTarget,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

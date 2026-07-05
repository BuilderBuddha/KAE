import { createContext, useContext, type ReactNode } from 'react';
import {
  useVigsyConversationState,
  type VigsyConversationTurn,
} from '../hooks/useVigsyConversation';
import { useNavigation } from './NavigationContext';

export type { VigsyConversationTurn };

type VigsyConversationValue = ReturnType<typeof useVigsyConversationState>;

const VigsyConversationContext = createContext<VigsyConversationValue | null>(null);

export function VigsyConversationProvider({ children }: { children: ReactNode }) {
  const { navigate } = useNavigation();
  const value = useVigsyConversationState(navigate);
  return (
    <VigsyConversationContext.Provider value={value}>{children}</VigsyConversationContext.Provider>
  );
}

export function useVigsyConversation(): VigsyConversationValue {
  const ctx = useContext(VigsyConversationContext);
  if (!ctx) {
    throw new Error('useVigsyConversation must be used within VigsyConversationProvider');
  }
  return ctx;
}

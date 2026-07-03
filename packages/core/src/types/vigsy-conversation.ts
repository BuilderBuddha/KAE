import type { VigsyConfidence, VigsyKnowledgeAnswer } from './vigsy-reasoning.js';

export interface VigsyConversationFollowUpContext {
  lastQuestion?: string;
  lastSearchQuery?: string;
  lastKrcIds?: string[];
}

/** Persisted turn in `.kae-sessions/conversations/`. */
export interface VigsyConversationTurnRecord {
  turnId: string;
  role: 'user' | 'assistant';
  createdAt: string;
  question?: string;
  displayText: string;
  supportingText?: string;
  answer?: VigsyKnowledgeAnswer;
  evidenceIds?: string[];
  confidence?: VigsyConfidence;
  followUpContext?: VigsyConversationFollowUpContext;
  error?: string;
}

export interface VigsyConversationRecord {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  turns: VigsyConversationTurnRecord[];
}

export interface VigsyActiveConversationState {
  conversationId: string;
  updatedAt: string;
}

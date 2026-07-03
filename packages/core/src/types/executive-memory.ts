import type { VigsyConversationFollowUpContext } from './vigsy-conversation.js';

export type ExecutiveSessionLifecycle = 'active' | 'paused' | 'closed' | 'archived';

export interface ExecutiveMemoryItem {
  id: string;
  label: string;
  detail?: string;
  sourceTurnId?: string;
  recordedAt: string;
}

/** Continuous executive memory for a Vigsy conversation session. */
export interface ExecutiveSessionRecord {
  sessionId: string;
  conversationId: string;
  lifecycle: ExecutiveSessionLifecycle;
  title: string;
  createdAt: string;
  updatedAt: string;
  pausedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  currentCampaign?: string;
  currentObjective?: string;
  currentDecisions: ExecutiveMemoryItem[];
  currentBlockers: ExecutiveMemoryItem[];
  currentAccomplishments: ExecutiveMemoryItem[];
  currentFiles: ExecutiveMemoryItem[];
  currentEvidence: ExecutiveMemoryItem[];
  currentRepositoryChanges: ExecutiveMemoryItem[];
  followUpContext?: VigsyConversationFollowUpContext;
  executiveSessionPath?: string;
  recommendedNextAction?: string;
  unfinishedWork: string[];
}

export interface ExecutiveMemoryManifest {
  version: 1;
  repositoryPath: string;
  founderName: string;
  activeSessionId?: string;
  lastSyncedAt?: string;
  sessions: Array<{
    sessionId: string;
    conversationId: string;
    lifecycle: ExecutiveSessionLifecycle;
    updatedAt: string;
  }>;
}

export interface ExecutiveContinuity {
  welcomeMessage: string;
  recommendedNextAction?: string;
  session: ExecutiveSessionRecord | null;
  hasUnfinishedWork: boolean;
  daysSinceLastActivity: number;
}

export interface ExecutiveMemorySyncResult {
  session: ExecutiveSessionRecord;
  evidenceIndexBuiltAt: string;
  relationshipIndexBuiltAt: string;
  briefingGeneratedAt: string;
}

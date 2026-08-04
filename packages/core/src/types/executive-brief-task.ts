import type { VigsyEvidenceCitation, VigsyConfidence, VigsyKnowledgeAnswer } from './vigsy-reasoning.js';

/** Only Executive Brief is implemented in Phase 3.1. */
export type GovernedTaskType = 'executive-brief';

export type ExecutiveBriefLifecycleState =
  | 'requested'
  | 'preparing'
  | 'preview-ready'
  | 'revision-requested'
  | 'approved'
  | 'writing'
  | 'saved-and-registered'
  | 'cancelled'
  | 'failed';

/** Structured preview sections — prose only; evidence identities remain frozen. */
export interface ExecutiveBriefPreviewContent {
  title: string;
  executiveConclusion: string;
  whatChangedOrMatters: string;
  supportingEvidenceSummary: string;
  uncertaintyAndGaps: string;
  recommendedNextAction: string;
  notYetSavedNotice: string;
}

export interface ExecutiveBriefEvidenceFreeze {
  fingerprint: string;
  evidenceUsed: VigsyEvidenceCitation[];
  confidence: VigsyConfidence;
  searchQuery: string;
  topic: string;
}

export interface ExecutiveBriefWriteResult {
  saved: true;
  relativePath: string;
  absolutePath: string;
  artifactId: string;
  registeredAt: string;
}

export interface ExecutiveBriefFailure {
  saved: false;
  message: string;
  partialWriteAttempted: boolean;
}

/** Governed Executive Brief task — renderer cannot force saved state. */
export interface ExecutiveBriefTask {
  taskId: string;
  taskType: 'executive-brief';
  state: ExecutiveBriefLifecycleState;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  revisionCount: number;
  evidence: ExecutiveBriefEvidenceFreeze;
  preview: ExecutiveBriefPreviewContent;
  /** Set only after successful main-process write + registration. */
  writeResult?: ExecutiveBriefWriteResult;
  failure?: ExecutiveBriefFailure;
  /** Idempotency key — retries after success return the same writeResult. */
  registrationKey: string;
}

export interface PrepareExecutiveBriefInput {
  conversationId: string;
  topic: string;
  answer: VigsyKnowledgeAnswer;
}

export interface ReviseExecutiveBriefInput {
  taskId: string;
  /** Revised prose source — evidence identities must remain the frozen set. */
  answer: VigsyKnowledgeAnswer;
}

export interface ApproveExecutiveBriefInput {
  taskId: string;
  /** Explicit approval token from UI — must match taskId. */
  approvalToken: string;
}

import type { EvidenceRecordKind } from './evidence-index.js';
import type { EvidenceTimelineStep } from './evidence-drilldown.js';
import type { VigsyRelationshipInsights } from './knowledge-relationship.js';

export type VigsyQuestionIntent = 'decision' | 'summarize' | 'show_evidence' | 'blockers' | 'general';

export interface RetrievedEvidenceItem {
  recordId: string;
  kind: EvidenceRecordKind;
  score: number;
  title: string;
  excerpt: string;
  explorerPath: string;
  krcId?: string;
  conversationTitle?: string;
  messageRole?: string;
  matchReasons: string[];
  timestamp?: string;
}

export interface AssembledEvidenceContext {
  question: string;
  intent: VigsyQuestionIntent;
  searchQuery: string;
  queryTerms: string[];
  items: RetrievedEvidenceItem[];
  topKrcIds: string[];
  executiveSessions: RetrievedEvidenceItem[];
  attachments: RetrievedEvidenceItem[];
  messages: RetrievedEvidenceItem[];
  relatedSources: RetrievedEvidenceItem[];
  timeline: EvidenceTimelineStep[];
}

export interface VigsyEvidenceCitation {
  recordId: string;
  label: string;
  excerpt: string;
  explorerPath: string;
  krcId?: string;
  kind: EvidenceRecordKind;
}

export type VigsyConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export interface VigsyConfidence {
  level: VigsyConfidenceLevel;
  score: number;
  rationale: string;
}

export interface VigsyExplorerLink {
  label: string;
  path: string;
  krcId?: string;
}

/** Grounded knowledge answer produced by Vigsy reasoning v1. */
export interface VigsyKnowledgeAnswer {
  question: string;
  intent: VigsyQuestionIntent;
  searchQuery: string;
  directAnswer: string;
  reasonedSummary: string;
  evidenceUsed: VigsyEvidenceCitation[];
  confidence: VigsyConfidence;
  timeline: EvidenceTimelineStep[];
  relatedSources: VigsyEvidenceCitation[];
  attachments: VigsyEvidenceCitation[];
  explorerLinks: VigsyExplorerLink[];
  relationshipInsights?: VigsyRelationshipInsights;
  /** Provider that produced prose (evidence remains KAE-owned). */
  reasoningProviderId?: import('./ai-orchestration.js').AIProviderId;
  /** True when a live provider was requested but offline grounded draft was used instead. */
  usedOfflineFallback?: boolean;
}

/** Pluggable answer composer — swap for LLM provider in future. */
export interface VigsyAnswerComposer {
  compose(context: AssembledEvidenceContext): VigsyKnowledgeAnswer;
}

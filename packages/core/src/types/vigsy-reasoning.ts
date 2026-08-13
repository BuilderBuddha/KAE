import type { EvidenceRecordKind } from './evidence-index.js';
import type { EvidenceTimelineStep } from './evidence-drilldown.js';
import type {
  RelatedEvidenceHit,
  VigsyRelationshipInsights,
} from './knowledge-relationship.js';

export type VigsyQuestionIntent =
  | 'decision'
  | 'summarize'
  | 'show_evidence'
  | 'blockers'
  | 'executive_brief'
  | 'source_lookup'
  | 'project_topic'
  | 'relationship_trace'
  | 'general';

/** Deterministic existence/status for an exact KRC source identity. */
export type SourceExistenceStatus =
  | 'exists_with_transcript'
  | 'exists_metadata_only'
  | 'does_not_exist';

export type SourceScopeAuthority =
  | 'none'
  | 'named_in_question'
  | 'ui_selection'
  | 'named_and_ui';

/** KAE-owned status for one exact source — never decided by the provider. */
export interface SourceStatusDetail {
  krcId: string;
  status: SourceExistenceStatus;
  sourceType?: string;
  captionStatus?: string;
  provenanceKind?: string;
  originalSourceUrl?: string;
  sourceKey?: string;
  videoId?: string;
  title?: string;
  repositoryPath?: string;
  recordId?: string;
}

/** Explicit source-scope authorization outside the model. */
export interface SourceScopeAuthorization {
  authorizedKrcIds: string[];
  authority: SourceScopeAuthority;
}

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
  /** Additive YouTube provenance — omitted for ChatGPT citations. */
  sourceType?: string;
  sourceKey?: string;
  videoId?: string;
  originalSourceUrl?: string;
  timestampSeconds?: number;
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
  /** Checkpoint D — exact source statuses when KRCs are authorized/named. */
  sourceStatuses?: SourceStatusDetail[];
  sourceScope?: SourceScopeAuthorization;
  /** True when the question asks for spoken/transcript content. */
  transcriptGroundingRequested?: boolean;
  /**
   * Checkpoint F0a — project/topic or relationship-trace context from the governed
   * relationship index (never model-invented).
   */
  relatedProjectTopics?: RelatedEvidenceHit[];
}

export interface VigsyEvidenceCitation {
  recordId: string;
  label: string;
  excerpt: string;
  explorerPath: string;
  krcId?: string;
  kind: EvidenceRecordKind;
  /** Additive YouTube provenance — omitted for ChatGPT citations. */
  sourceType?: string;
  sourceKey?: string;
  videoId?: string;
  originalSourceUrl?: string;
  timestampSeconds?: number;
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
  /** Checkpoint D — deterministic source identity/status (provider cannot change). */
  sourceStatuses?: SourceStatusDetail[];
  sourceScope?: SourceScopeAuthorization;
  /**
   * Navigation-only source lookup — skip Executive Session / awareness sync.
   * Conversation JSON may still persist for UX; it must not feed retrieval as decision evidence.
   */
  suppressExecutiveMemory?: boolean;
  /** When true, provider prose must not replace the deterministic directAnswer/refusal. */
  lockDeterministicProse?: boolean;
  /**
   * Checkpoint F0a — related projects/topics backed by the relationship index.
   * Present when project_topic / relationship_trace routing used governed links.
   */
  relatedProjectTopics?: RelatedEvidenceHit[];
}

/** Pluggable answer composer — swap for LLM provider in future. */
export interface VigsyAnswerComposer {
  compose(context: AssembledEvidenceContext): VigsyKnowledgeAnswer;
}

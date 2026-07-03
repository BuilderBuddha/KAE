/** Semantic relationship types for Campaign 1.4 Knowledge Relationship Engine. */
export type KnowledgeRelationshipType =
  | 'conversation_conversation'
  | 'conversation_executive_session'
  | 'conversation_source'
  | 'conversation_attachment'
  | 'executive_session_source'
  | 'executive_session_executive_session'
  | 'decision_decision'
  | 'topic_topic'
  | 'campaign_campaign'
  | 'person_person'
  | 'capability_capability'
  | 'attachment_source'
  | 'attachment_conversation';

export interface KnowledgeRelationship {
  relationshipId: string;
  fromId: string;
  toId: string;
  relationshipType: KnowledgeRelationshipType;
  reason: string;
  confidence: number;
  supportingEvidenceIds: string[];
  createdAutomatically: true;
  lastValidated?: string;
}

export interface KnowledgeRelationshipIndex {
  version: 1;
  repositoryPath: string;
  builtAt: string;
  relationshipCount: number;
  relationships: KnowledgeRelationship[];
}

export interface KnowledgeRelationshipStats {
  builtAt: string;
  relationshipCount: number;
  byType: Record<string, number>;
}

export interface RelatedEvidenceHit {
  recordId: string;
  label: string;
  excerpt: string;
  explorerPath: string;
  krcId?: string;
  kind: string;
  relationshipType: KnowledgeRelationshipType;
  reason: string;
  confidence: number;
}

/** Relationship-enriched groups for Vigsy answers (no UI redesign). */
export interface VigsyRelationshipInsights {
  relatedDecisions: RelatedEvidenceHit[];
  relatedConversations: RelatedEvidenceHit[];
  relatedCampaigns: RelatedEvidenceHit[];
  relatedAttachments: RelatedEvidenceHit[];
  relatedExecutiveSessions: RelatedEvidenceHit[];
}

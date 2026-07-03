/** Awareness card categories for Campaign 1.4b Executive Awareness. */
export type ExecutiveAwarenessCategory =
  | 'recent_decision'
  | 'recent_blocker'
  | 'recent_import'
  | 'high_relationship_topic'
  | 'suggested_next_action'
  | 'repository_health';

export interface ExecutiveAwarenessEvidenceLink {
  recordId?: string;
  label: string;
  explorerPath: string;
  krcId?: string;
  kind?: string;
}

/** Deterministic, evidence-backed awareness card for Vigsy Home. */
export interface ExecutiveAwarenessCard {
  cardId: string;
  category: ExecutiveAwarenessCategory;
  title: string;
  summary: string;
  whyItMatters: string;
  confidence: number;
  evidenceLinks: ExecutiveAwarenessEvidenceLink[];
  /** True when the card reports absence of findings (e.g. no critical blockers). */
  isPlaceholder?: boolean;
}

export interface ExecutiveBriefing {
  version: 1;
  repositoryPath: string;
  generatedAt: string;
  evidenceRecordCount: number;
  relationshipCount: number;
  cards: ExecutiveAwarenessCard[];
}

/** Persisted executive briefing cache under `.kae-index/`. */
export interface ExecutiveBriefingCache {
  version: 1;
  repositoryPath: string;
  cachedAt: string;
  evidenceIndexBuiltAt: string;
  evidenceIndexMtimeMs: number;
  relationshipIndexBuiltAt: string;
  relationshipIndexMtimeMs: number;
  briefing: ExecutiveBriefing;
}

/** Result of loading an executive briefing with cache metadata. */
export interface ExecutiveBriefingLoadResult {
  briefing: ExecutiveBriefing;
  fromCache: boolean;
  stale: boolean;
}

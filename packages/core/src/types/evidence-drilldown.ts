import type { EvidenceRecordKind } from './evidence-index.js';

/** Explorer link within an evidence drilldown section. */
export interface EvidenceDrilldownLink {
  label: string;
  explorerPath: string;
  recordId?: string;
  kind?: EvidenceRecordKind;
  subtitle?: string;
  highlighted?: boolean;
  /** Additive: validated external URL (e.g. canonical YouTube watch URL). */
  externalUrl?: string;
}

/** One navigable section of the evidence chain. */
export interface EvidenceDrilldownSection {
  id: string;
  title: string;
  items: EvidenceDrilldownLink[];
  emptyMessage?: string;
}

export type EvidenceTimelineStepKind =
  | 'conversation'
  | 'executive_session'
  | 'related_sources'
  | 'newest_evidence'
  | 'youtube_evidence'
  | 'youtube_original_source';

/** Ordered timeline step linking into Explorer. */
export interface EvidenceTimelineStep {
  kind: EvidenceTimelineStepKind;
  label: string;
  subtitle?: string;
  timestamp?: string;
  explorerPath: string;
  recordId?: string;
}

/** Deterministic evidence chain resolved from a search hit. */
export interface EvidenceDrilldown {
  anchorRecordId: string;
  anchorKrcId?: string;
  anchorSourcePath: string;
  query?: string;
  decisionSummary: string;
  sections: {
    decisionSummary: EvidenceDrilldownSection;
    sourceFile: EvidenceDrilldownSection;
    conversation: EvidenceDrilldownSection;
    messages: EvidenceDrilldownSection;
    attachments: EvidenceDrilldownSection;
    executiveSession: EvidenceDrilldownSection;
    relatedSources: EvidenceDrilldownSection;
    timeline: EvidenceDrilldownSection;
  };
  timeline: EvidenceTimelineStep[];
}

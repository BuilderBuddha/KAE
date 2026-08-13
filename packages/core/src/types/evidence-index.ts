/** Evidence index record kinds for Campaign 1.2 Knowledge Intelligence. */
export type EvidenceRecordKind =
  | 'source'
  | 'conversation'
  | 'message'
  | 'attachment'
  | 'executive_session';

export interface EvidenceRepositoryFields {
  krcId?: string;
  repositoryPath: string;
  category: string;
  sourceType: string;
}

export interface EvidenceConversationFields {
  conversationId?: string;
  title?: string;
  created?: string;
  updated?: string;
}

export interface EvidenceMessageFields {
  messageId: string;
  role: string;
  timestamp?: string;
  text: string;
  searchTerms: string[];
}

export interface EvidenceAttachmentFields {
  attachmentId: string;
  filename: string;
  mimeType?: string;
  assetPath?: string;
  linkedMessageId?: string;
  resolved: boolean;
}

export interface EvidenceSessionFields {
  sessionId: string;
  linkedKrcId?: string;
  summaryReferences: string[];
  transcriptReference?: string;
}

/** Additive YouTube provenance — optional; ChatGPT records omit this. */
export interface EvidenceYouTubeFields {
  sourceType: 'youtube';
  sourceKey: string;
  videoId: string;
  originalSourceUrl: string;
  captionStatus?: string;
  /** Present only when a valid upstream caption segment supplies timing. */
  timestampSeconds?: number;
  /** Distinct caption provenance when known; metadata-only sources omit transcript use. */
  provenanceKind?:
    | 'youtube_creator_captions'
    | 'youtube_machine_captions'
    | 'kae_machine_transcription'
    | 'youtube_metadata';
}

/** Canonical searchable evidence record consumed by search and future intelligence layers. */
export interface EvidenceRecord {
  id: string;
  kind: EvidenceRecordKind;
  repository: EvidenceRepositoryFields;
  conversation?: EvidenceConversationFields;
  message?: EvidenceMessageFields;
  attachment?: EvidenceAttachmentFields;
  session?: EvidenceSessionFields;
  /** Additive Checkpoint C YouTube provenance. */
  youtube?: EvidenceYouTubeFields;
  excerpt: string;
}

export interface EvidenceIndex {
  version: 1;
  repositoryPath: string;
  builtAt: string;
  recordCount: number;
  records: EvidenceRecord[];
}

export interface EvidenceIndexStats {
  builtAt: string;
  recordCount: number;
  sources: number;
  conversations: number;
  messages: number;
  attachments: number;
  executiveSessions: number;
}

export type EvidenceSearchMatchField =
  | 'krcId'
  | 'title'
  | 'keyword'
  | 'prompt'
  | 'response'
  | 'filename'
  | 'message'
  | 'session'
  | 'attachment';

/** Search hit with evidence drilldown metadata. */
export interface EvidenceSearchResult {
  recordId: string;
  kind: EvidenceRecordKind;
  score: number;
  matchFields: EvidenceSearchMatchField[];
  title: string;
  snippet: string;
  drilldownPath: string;
  krcId?: string;
  conversationTitle?: string;
  messageRole?: string;
  attachmentFilename?: string;
  category: 'source' | 'session' | 'registry' | 'report' | 'attachment';
}

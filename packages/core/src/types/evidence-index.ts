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

/** Canonical searchable evidence record consumed by search and future intelligence layers. */
export interface EvidenceRecord {
  id: string;
  kind: EvidenceRecordKind;
  repository: EvidenceRepositoryFields;
  conversation?: EvidenceConversationFields;
  message?: EvidenceMessageFields;
  attachment?: EvidenceAttachmentFields;
  session?: EvidenceSessionFields;
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

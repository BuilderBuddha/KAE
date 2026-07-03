/** Product/project categories for imported conversations. */
export type ConversationCategory =
  | 'VIGS'
  | 'Founder OS'
  | 'Axiom'
  | 'Book'
  | 'Knowledge Recovery'
  | 'Source Material'
  | 'Technical Build'
  | 'Other / Review Needed';

/** Classification result for a single conversation. */
export interface ConversationClassification {
  categories: ConversationCategory[];
  primaryCategory: ConversationCategory;
  confidence: number;
  inferredProject: string;
  recurringTerms: string[];
  uncertain: boolean;
  rationale: string;
  categoryScores: Record<ConversationCategory, number>;
}

/** Per-conversation import review row. */
export interface ImportReviewEntry {
  krcId: string;
  conversationId: string;
  title: string;
  primaryCategory: ConversationCategory;
  categories: ConversationCategory[];
  confidence: number;
  uncertain: boolean;
  status: 'classified' | 'uncertain' | 'skipped' | 'error' | 'updated';
  sourcePath?: string;
  sessionPath?: string;
  notes?: string;
}

/** Planned action for one conversation during validation. */
export interface ImportPlannedRecord {
  conversationId: string;
  title: string;
  krcId: string;
  action: 'create' | 'update' | 'skip';
  primaryCategory: ConversationCategory;
  categories: ConversationCategory[];
  uncertain: boolean;
  sourcePath: string;
  sessionPath: string;
}

/** Read-only validation report before repository mutation. */
export interface ImportValidationReport {
  valid: boolean;
  fileName: string;
  filePath: string;
  zipReadable: boolean;
  chatGptStructureDetected: boolean;
  conversationsJsonPresent: boolean;
  conversationsFound: number;
  uploadedFilesCount: number;
  uploadedFileNames: string[];
  estimatedSourcesToCreate: number;
  estimatedSourcesToUpdate: number;
  estimatedDuplicatesSkipped: number;
  uncertainCount: number;
  errors: string[];
  warnings: string[];
  blockingErrors: string[];
  plannedRecords: ImportPlannedRecord[];
  outputLocations: {
    sourcesRoot: string;
    uploadsPattern: string;
    executiveSessionsRoot: string;
    registryPath: string;
    reviewPath: string;
  };
  repositoryPath: string;
  validatedAt?: string;
  durationMs?: number;
  diffPreview?: import('./import-rc.js').ImportDiffPreview;
}

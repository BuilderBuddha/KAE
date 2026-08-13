import type {
  AppSettings,
  RepositoryConfig,
  LogEntry,
  ImportJob,
  ImportSummary,
  ImportValidationReport,
  ImportTimelineStep,
  GitReadinessReport,
  ValidationProgress,
  RepairPlan,
  RepairResult,
  ExecutiveBriefTask,
  PrepareExecutiveBriefInput,
  ReviseExecutiveBriefInput,
  RepositoryFileEntry,
  RepositoryHealthReport,
  RepositorySearchResult,
  RepositoryStats,
  EvidenceIndexStats,
  EvidenceDrilldown,
  VigsyKnowledgeAnswer,
  KnowledgeRelationship,
  KnowledgeRelationshipStats,
  RelatedEvidenceHit,
  ExecutiveBriefing,
  ExecutiveBriefingLoadResult,
  ExecutiveContinuity,
  VigsyConversationRecord,
  AnswerKnowledgeOptions,
  ProviderCapabilities,
  AIProviderId,
  LiveCaptureInput,
  LiveCaptureResult,
  ProviderHealthResult,
  ReasoningStreamChunk,
  ConnectorStatus,
  ConnectorConfig,
  ConnectorEvent,
  ConnectorId,
  ConnectorResult,
  SyncHistoryEntry,
} from '@scooper/core';

export interface ImporterInfo {
  id: string;
  name: string;
  description: string;
  supportedExtensions: readonly string[];
}

export interface ChatGptImportListEntry {
  name: string;
  relativePath: string;
  krcId: string;
  title: string;
  createTime?: string;
  updateTime?: string;
  sortTime: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface ChatGptSourcePreviewData {
  parsed: {
    krcId: string;
    title: string;
    conversationId?: string;
    createTime?: string;
    updateTime?: string;
    description?: string;
    fileReferences: string[];
    messages: Array<{
      role: string;
      timestamp?: string;
      text: string;
      fileReferences: string[];
    }>;
  };
  assets: Array<{
    ref: string;
    relativePath: string;
    fileName: string;
    mimeType: string;
    kind: 'image' | 'video' | 'other';
  }>;
}

export interface RepositoryAssetData {
  assetUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface KaeAPI {
  getImporters: () => Promise<ImporterInfo[]>;
  getRepositoryConfig: () => Promise<RepositoryConfig>;
  setRepositoryConfig: (config: RepositoryConfig) => Promise<RepositoryConfig>;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: AppSettings) => Promise<AppSettings>;
  getJobs: () => Promise<ImportJob[]>;
  getLogs: () => Promise<LogEntry[]>;
  getDefaultRepositoryPath: () => Promise<string>;
  getRepositoryHealth: () => Promise<RepositoryHealthReport>;
  getGitReadiness: () => Promise<GitReadinessReport>;
  getRepositoryStats: () => Promise<RepositoryStats>;
  browseRepository: () => Promise<RepositoryFileEntry[]>;
  listChatGptImportEntries: () => Promise<ChatGptImportListEntry[]>;
  readRepositoryFile: (relativePath: string) => Promise<string>;
  parseChatGptSource: (relativePath: string) => Promise<ChatGptSourcePreviewData | null>;
  readRepositoryAsset: (relativePath: string, refHint?: string) => Promise<RepositoryAssetData>;
  searchRepository: (query: string) => Promise<RepositorySearchResult[]>;
  buildEvidenceIndex: () => Promise<EvidenceIndexStats>;
  searchKnowledge: (query: string) => Promise<RepositorySearchResult[]>;
  resolveEvidenceDrilldown: (recordId: string, query?: string) => Promise<EvidenceDrilldown | null>;
  answerKnowledgeQuestion: (question: string, options?: AnswerKnowledgeOptions) => Promise<VigsyKnowledgeAnswer>;
  answerKnowledgeQuestionStream: (
    question: string,
    options?: AnswerKnowledgeOptions,
  ) => Promise<VigsyKnowledgeAnswer>;
  buildRelationshipIndex: () => Promise<KnowledgeRelationshipStats>;
  searchRelationships: (query: string) => Promise<KnowledgeRelationship[]>;
  getRelationshipsForEvidence: (evidenceId: string) => Promise<KnowledgeRelationship[]>;
  getRelatedEvidence: (anchor: string, query?: string) => Promise<RelatedEvidenceHit[]>;
  getExecutiveBriefing: () => Promise<ExecutiveBriefingLoadResult>;
  refreshExecutiveBriefing: () => Promise<ExecutiveBriefing>;
  loadActiveVigsyConversation: () => Promise<VigsyConversationRecord | null>;
  ensureActiveVigsyConversation: () => Promise<VigsyConversationRecord>;
  saveVigsyConversation: (record: VigsyConversationRecord) => Promise<string>;
  createVigsyConversation: () => Promise<VigsyConversationRecord>;
  deleteVigsyConversation: (conversationId: string) => Promise<void>;
  getExecutiveContinuity: () => Promise<ExecutiveContinuity>;
  listAiProviders: () => Promise<ProviderCapabilities[]>;
  testAiProvider: (providerId?: AIProviderId) => Promise<ProviderHealthResult>;
  getProviderHealth: () => Promise<ProviderHealthResult>;
  getProviderKeyStatus: () => Promise<{
    secureStorage: 'available' | 'dev_fallback';
    providers: Record<string, boolean>;
  }>;
  setProviderApiKey: (providerId: AIProviderId, apiKey: string) => Promise<boolean>;
  captureLiveSession: (input: LiveCaptureInput) => Promise<LiveCaptureResult>;
  openRepositoryPath: () => Promise<void>;
  openRepositoryFile: (relativePath: string) => Promise<void>;
  revealRepositoryFile: (relativePath: string) => Promise<void>;
  openTrustedYouTubeUrl: (
    url: string,
  ) => Promise<{ opened: true } | { opened: false; reason: 'rejected_untrusted_url' }>;
  copyText: (text: string) => Promise<boolean>;
  getLastValidation: () => Promise<ImportValidationReport | null>;
  getLastImportSummary: () => Promise<ImportSummary | null>;
  selectZipFile: () => Promise<string | null>;
  validateChatGptZip: (filePath: string) => Promise<ImportValidationReport>;
  cancelValidation: () => Promise<boolean>;
  analyzeRepositoryRepair: () => Promise<RepairPlan>;
  executeRepositoryRepair: (plan: RepairPlan) => Promise<RepairResult>;
  getLastRepairPlan: () => Promise<RepairPlan | null>;
  getLastRepairResult: () => Promise<RepairResult | null>;
  prepareExecutiveBrief: (input: PrepareExecutiveBriefInput) => Promise<ExecutiveBriefTask>;
  getExecutiveBriefTask: (taskId: string) => Promise<ExecutiveBriefTask | null>;
  requestExecutiveBriefRevision: (taskId: string) => Promise<ExecutiveBriefTask>;
  reviseExecutiveBrief: (input: ReviseExecutiveBriefInput) => Promise<ExecutiveBriefTask>;
  cancelExecutiveBrief: (taskId: string) => Promise<ExecutiveBriefTask>;
  approveExecutiveBrief: (input: {
    taskId: string;
    approvalToken: string;
  }) => Promise<ExecutiveBriefTask>;
  isExecutiveBriefRequest: (question: string) => Promise<boolean>;
  importChatGptZip: (filePath: string) => Promise<ImportSummary>;
  getConnectorStatuses: () => Promise<ConnectorStatus[]>;
  connectConnector: (connectorId: ConnectorId, config: Partial<ConnectorConfig>) => Promise<unknown>;
  disconnectConnector: (connectorId: ConnectorId) => Promise<boolean>;
  updateConnectorConfig: (connectorId: ConnectorId, config: Partial<ConnectorConfig>) => Promise<ConnectorConfig>;
  syncConnector: (connectorId: ConnectorId, sourcePath?: string | null) => Promise<ConnectorResult>;
  getConnectorSyncHistory: (connectorId?: ConnectorId) => Promise<SyncHistoryEntry[]>;
  getConnectorEvents: (connectorId?: ConnectorId) => Promise<ConnectorEvent[]>;
  selectFolder: () => Promise<string | null>;
  onJobUpdated: (callback: (job: ImportJob) => void) => () => void;
  onLogAdded: (callback: (entry: LogEntry) => void) => () => void;
  onImportComplete: (callback: (summary: ImportSummary) => void) => () => void;
  onImportTimeline: (callback: (steps: ImportTimelineStep[]) => void) => () => void;
  onValidationProgress: (callback: (progress: ValidationProgress) => void) => () => void;
  onExecutiveBriefingUpdated: (callback: () => void) => () => void;
  onExecutiveMemoryUpdated: (callback: () => void) => () => void;
  onVigsyRefreshed: (callback: () => void) => () => void;
  onReasoningStreamChunk: (callback: (chunk: ReasoningStreamChunk) => void) => () => void;
}

declare global {
  interface Window {
    kae: KaeAPI;
  }
}

export {};

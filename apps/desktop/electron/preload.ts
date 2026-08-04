import { contextBridge, ipcRenderer } from 'electron';
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

import type { ChatGptImportListEntry, ChatGptSourcePreviewData, RepositoryAssetData } from '../src/types/kae.js';

export interface ImporterInfo {
  id: string;
  name: string;
  description: string;
  supportedExtensions: readonly string[];
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

const kaeAPI: KaeAPI = {
  getImporters: () => ipcRenderer.invoke('kae:get-importers'),
  getRepositoryConfig: () => ipcRenderer.invoke('kae:get-repository-config'),
  setRepositoryConfig: (config) => ipcRenderer.invoke('kae:set-repository-config', config),
  getSettings: () => ipcRenderer.invoke('kae:get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('kae:set-settings', settings),
  getJobs: () => ipcRenderer.invoke('kae:get-jobs'),
  getLogs: () => ipcRenderer.invoke('kae:get-logs'),
  getDefaultRepositoryPath: () => ipcRenderer.invoke('kae:get-default-repository-path'),
  getRepositoryHealth: () => ipcRenderer.invoke('kae:get-repository-health'),
  getGitReadiness: () => ipcRenderer.invoke('kae:get-git-readiness'),
  getRepositoryStats: () => ipcRenderer.invoke('kae:get-repository-stats'),
  browseRepository: () => ipcRenderer.invoke('kae:browse-repository'),
  listChatGptImportEntries: () => ipcRenderer.invoke('kae:list-chatgpt-import-entries'),
  readRepositoryFile: (relativePath) => ipcRenderer.invoke('kae:read-repository-file', relativePath),
  parseChatGptSource: (relativePath) => ipcRenderer.invoke('kae:parse-chatgpt-source', relativePath),
  readRepositoryAsset: (relativePath, refHint) =>
    ipcRenderer.invoke('kae:read-repository-asset', relativePath, refHint),
  searchRepository: (query) => ipcRenderer.invoke('kae:search-repository', query),
  buildEvidenceIndex: () => ipcRenderer.invoke('kae:build-evidence-index'),
  searchKnowledge: (query) => ipcRenderer.invoke('kae:search-knowledge', query),
  resolveEvidenceDrilldown: (recordId, query) =>
    ipcRenderer.invoke('kae:resolve-evidence-drilldown', recordId, query),
  answerKnowledgeQuestion: (question, options) =>
    ipcRenderer.invoke('kae:answer-knowledge-question', question, options),
  answerKnowledgeQuestionStream: (question, options) =>
    ipcRenderer.invoke('kae:answer-knowledge-question-stream', question, options),
  buildRelationshipIndex: () => ipcRenderer.invoke('kae:build-relationship-index'),
  searchRelationships: (query) => ipcRenderer.invoke('kae:search-relationships', query),
  getRelationshipsForEvidence: (evidenceId) =>
    ipcRenderer.invoke('kae:get-relationships-for-evidence', evidenceId),
  getRelatedEvidence: (anchor, query) => ipcRenderer.invoke('kae:get-related-evidence', anchor, query),
  getExecutiveBriefing: () => ipcRenderer.invoke('kae:get-executive-briefing'),
  refreshExecutiveBriefing: () => ipcRenderer.invoke('kae:refresh-executive-briefing'),
  loadActiveVigsyConversation: () => ipcRenderer.invoke('kae:load-active-vigsy-conversation'),
  saveVigsyConversation: (record) => ipcRenderer.invoke('kae:save-vigsy-conversation', record),
  createVigsyConversation: () => ipcRenderer.invoke('kae:create-vigsy-conversation'),
  deleteVigsyConversation: (conversationId) =>
    ipcRenderer.invoke('kae:delete-vigsy-conversation', conversationId),
  getExecutiveContinuity: () => ipcRenderer.invoke('kae:get-executive-continuity'),
  listAiProviders: () => ipcRenderer.invoke('kae:list-ai-providers'),
  testAiProvider: (providerId) => ipcRenderer.invoke('kae:test-ai-provider', providerId),
  getProviderHealth: () => ipcRenderer.invoke('kae:get-provider-health'),
  getProviderKeyStatus: () => ipcRenderer.invoke('kae:get-provider-key-status'),
  setProviderApiKey: (providerId, apiKey) =>
    ipcRenderer.invoke('kae:set-provider-api-key', providerId, apiKey),
  captureLiveSession: (input) => ipcRenderer.invoke('kae:capture-live-session', input),
  openRepositoryPath: () => ipcRenderer.invoke('kae:open-repository-path'),
  openRepositoryFile: (relativePath) => ipcRenderer.invoke('kae:open-repository-file', relativePath),
  revealRepositoryFile: (relativePath) => ipcRenderer.invoke('kae:reveal-repository-file', relativePath),
  copyText: (text) => ipcRenderer.invoke('kae:copy-text', text),
  getLastValidation: () => ipcRenderer.invoke('kae:get-last-validation'),
  getLastImportSummary: () => ipcRenderer.invoke('kae:get-last-import-summary'),
  selectZipFile: () => ipcRenderer.invoke('kae:select-zip-file'),
  validateChatGptZip: (filePath) => ipcRenderer.invoke('kae:validate-chatgpt-zip', filePath),
  cancelValidation: () => ipcRenderer.invoke('kae:cancel-validation'),
  analyzeRepositoryRepair: () => ipcRenderer.invoke('kae:analyze-repository-repair'),
  executeRepositoryRepair: (plan) => ipcRenderer.invoke('kae:execute-repository-repair', plan),
  getLastRepairPlan: () => ipcRenderer.invoke('kae:get-last-repair-plan'),
  getLastRepairResult: () => ipcRenderer.invoke('kae:get-last-repair-result'),
  prepareExecutiveBrief: (input) => ipcRenderer.invoke('kae:prepare-executive-brief', input),
  getExecutiveBriefTask: (taskId) => ipcRenderer.invoke('kae:get-executive-brief-task', taskId),
  requestExecutiveBriefRevision: (taskId) =>
    ipcRenderer.invoke('kae:request-executive-brief-revision', taskId),
  reviseExecutiveBrief: (input) => ipcRenderer.invoke('kae:revise-executive-brief', input),
  cancelExecutiveBrief: (taskId) => ipcRenderer.invoke('kae:cancel-executive-brief', taskId),
  approveExecutiveBrief: (input) => ipcRenderer.invoke('kae:approve-executive-brief', input),
  isExecutiveBriefRequest: (question) => ipcRenderer.invoke('kae:is-executive-brief-request', question),
  importChatGptZip: (filePath) => ipcRenderer.invoke('kae:import-chatgpt-zip', filePath),
  getConnectorStatuses: () => ipcRenderer.invoke('kae:get-connector-statuses'),
  connectConnector: (connectorId, config) =>
    ipcRenderer.invoke('kae:connect-connector', connectorId, config),
  disconnectConnector: (connectorId) => ipcRenderer.invoke('kae:disconnect-connector', connectorId),
  updateConnectorConfig: (connectorId, config) =>
    ipcRenderer.invoke('kae:update-connector-config', connectorId, config),
  syncConnector: (connectorId, sourcePath) =>
    ipcRenderer.invoke('kae:sync-connector', connectorId, sourcePath ?? null),
  getConnectorSyncHistory: (connectorId) =>
    ipcRenderer.invoke('kae:get-connector-sync-history', connectorId),
  getConnectorEvents: (connectorId) => ipcRenderer.invoke('kae:get-connector-events', connectorId),
  selectFolder: () => ipcRenderer.invoke('kae:select-folder'),
  onJobUpdated: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, job: ImportJob) => callback(job);
    ipcRenderer.on('kae:job-updated', handler);
    return () => ipcRenderer.removeListener('kae:job-updated', handler);
  },
  onLogAdded: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: LogEntry) => callback(entry);
    ipcRenderer.on('kae:log-added', handler);
    return () => ipcRenderer.removeListener('kae:log-added', handler);
  },
  onImportComplete: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, summary: ImportSummary) => callback(summary);
    ipcRenderer.on('kae:import-complete', handler);
    return () => ipcRenderer.removeListener('kae:import-complete', handler);
  },
  onImportTimeline: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, steps: ImportTimelineStep[]) => callback(steps);
    ipcRenderer.on('kae:import-timeline', handler);
    return () => ipcRenderer.removeListener('kae:import-timeline', handler);
  },
  onValidationProgress: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ValidationProgress) =>
      callback(progress);
    ipcRenderer.on('kae:validation-progress', handler);
    return () => ipcRenderer.removeListener('kae:validation-progress', handler);
  },
  onExecutiveBriefingUpdated: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('kae:executive-briefing-updated', handler);
    return () => ipcRenderer.removeListener('kae:executive-briefing-updated', handler);
  },
  onExecutiveMemoryUpdated: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('kae:executive-memory-updated', handler);
    return () => ipcRenderer.removeListener('kae:executive-memory-updated', handler);
  },
  onVigsyRefreshed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('kae:vigsy-refreshed', handler);
    return () => ipcRenderer.removeListener('kae:vigsy-refreshed', handler);
  },
  onReasoningStreamChunk: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: ReasoningStreamChunk) => callback(chunk);
    ipcRenderer.on('kae:reasoning-stream-chunk', handler);
    return () => ipcRenderer.removeListener('kae:reasoning-stream-chunk', handler);
  },
};

contextBridge.exposeInMainWorld('kae', kaeAPI);

declare global {
  interface Window {
    kae: KaeAPI;
  }
}

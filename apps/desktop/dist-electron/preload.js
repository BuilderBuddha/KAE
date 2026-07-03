"use strict";
const electron = require("electron");
const kaeAPI = {
  getImporters: () => electron.ipcRenderer.invoke("kae:get-importers"),
  getRepositoryConfig: () => electron.ipcRenderer.invoke("kae:get-repository-config"),
  setRepositoryConfig: (config) => electron.ipcRenderer.invoke("kae:set-repository-config", config),
  getSettings: () => electron.ipcRenderer.invoke("kae:get-settings"),
  setSettings: (settings) => electron.ipcRenderer.invoke("kae:set-settings", settings),
  getJobs: () => electron.ipcRenderer.invoke("kae:get-jobs"),
  getLogs: () => electron.ipcRenderer.invoke("kae:get-logs"),
  getDefaultRepositoryPath: () => electron.ipcRenderer.invoke("kae:get-default-repository-path"),
  getRepositoryHealth: () => electron.ipcRenderer.invoke("kae:get-repository-health"),
  getGitReadiness: () => electron.ipcRenderer.invoke("kae:get-git-readiness"),
  getRepositoryStats: () => electron.ipcRenderer.invoke("kae:get-repository-stats"),
  browseRepository: () => electron.ipcRenderer.invoke("kae:browse-repository"),
  listChatGptImportEntries: () => electron.ipcRenderer.invoke("kae:list-chatgpt-import-entries"),
  readRepositoryFile: (relativePath) => electron.ipcRenderer.invoke("kae:read-repository-file", relativePath),
  parseChatGptSource: (relativePath) => electron.ipcRenderer.invoke("kae:parse-chatgpt-source", relativePath),
  readRepositoryAsset: (relativePath, refHint) => electron.ipcRenderer.invoke("kae:read-repository-asset", relativePath, refHint),
  searchRepository: (query) => electron.ipcRenderer.invoke("kae:search-repository", query),
  buildEvidenceIndex: () => electron.ipcRenderer.invoke("kae:build-evidence-index"),
  searchKnowledge: (query) => electron.ipcRenderer.invoke("kae:search-knowledge", query),
  resolveEvidenceDrilldown: (recordId, query) => electron.ipcRenderer.invoke("kae:resolve-evidence-drilldown", recordId, query),
  answerKnowledgeQuestion: (question, options) => electron.ipcRenderer.invoke("kae:answer-knowledge-question", question, options),
  answerKnowledgeQuestionStream: (question, options) => electron.ipcRenderer.invoke("kae:answer-knowledge-question-stream", question, options),
  buildRelationshipIndex: () => electron.ipcRenderer.invoke("kae:build-relationship-index"),
  searchRelationships: (query) => electron.ipcRenderer.invoke("kae:search-relationships", query),
  getRelationshipsForEvidence: (evidenceId) => electron.ipcRenderer.invoke("kae:get-relationships-for-evidence", evidenceId),
  getRelatedEvidence: (anchor, query) => electron.ipcRenderer.invoke("kae:get-related-evidence", anchor, query),
  getExecutiveBriefing: () => electron.ipcRenderer.invoke("kae:get-executive-briefing"),
  refreshExecutiveBriefing: () => electron.ipcRenderer.invoke("kae:refresh-executive-briefing"),
  loadActiveVigsyConversation: () => electron.ipcRenderer.invoke("kae:load-active-vigsy-conversation"),
  saveVigsyConversation: (record) => electron.ipcRenderer.invoke("kae:save-vigsy-conversation", record),
  createVigsyConversation: () => electron.ipcRenderer.invoke("kae:create-vigsy-conversation"),
  deleteVigsyConversation: (conversationId) => electron.ipcRenderer.invoke("kae:delete-vigsy-conversation", conversationId),
  getExecutiveContinuity: () => electron.ipcRenderer.invoke("kae:get-executive-continuity"),
  listAiProviders: () => electron.ipcRenderer.invoke("kae:list-ai-providers"),
  testAiProvider: (providerId) => electron.ipcRenderer.invoke("kae:test-ai-provider", providerId),
  getProviderHealth: () => electron.ipcRenderer.invoke("kae:get-provider-health"),
  getProviderKeyStatus: () => electron.ipcRenderer.invoke("kae:get-provider-key-status"),
  setProviderApiKey: (providerId, apiKey) => electron.ipcRenderer.invoke("kae:set-provider-api-key", providerId, apiKey),
  captureLiveSession: (input) => electron.ipcRenderer.invoke("kae:capture-live-session", input),
  openRepositoryPath: () => electron.ipcRenderer.invoke("kae:open-repository-path"),
  openRepositoryFile: (relativePath) => electron.ipcRenderer.invoke("kae:open-repository-file", relativePath),
  revealRepositoryFile: (relativePath) => electron.ipcRenderer.invoke("kae:reveal-repository-file", relativePath),
  copyText: (text) => electron.ipcRenderer.invoke("kae:copy-text", text),
  getLastValidation: () => electron.ipcRenderer.invoke("kae:get-last-validation"),
  getLastImportSummary: () => electron.ipcRenderer.invoke("kae:get-last-import-summary"),
  selectZipFile: () => electron.ipcRenderer.invoke("kae:select-zip-file"),
  validateChatGptZip: (filePath) => electron.ipcRenderer.invoke("kae:validate-chatgpt-zip", filePath),
  cancelValidation: () => electron.ipcRenderer.invoke("kae:cancel-validation"),
  analyzeRepositoryRepair: () => electron.ipcRenderer.invoke("kae:analyze-repository-repair"),
  executeRepositoryRepair: (plan) => electron.ipcRenderer.invoke("kae:execute-repository-repair", plan),
  getLastRepairPlan: () => electron.ipcRenderer.invoke("kae:get-last-repair-plan"),
  getLastRepairResult: () => electron.ipcRenderer.invoke("kae:get-last-repair-result"),
  importChatGptZip: (filePath) => electron.ipcRenderer.invoke("kae:import-chatgpt-zip", filePath),
  getConnectorStatuses: () => electron.ipcRenderer.invoke("kae:get-connector-statuses"),
  connectConnector: (connectorId, config) => electron.ipcRenderer.invoke("kae:connect-connector", connectorId, config),
  disconnectConnector: (connectorId) => electron.ipcRenderer.invoke("kae:disconnect-connector", connectorId),
  updateConnectorConfig: (connectorId, config) => electron.ipcRenderer.invoke("kae:update-connector-config", connectorId, config),
  syncConnector: (connectorId, sourcePath) => electron.ipcRenderer.invoke("kae:sync-connector", connectorId, sourcePath ?? null),
  getConnectorSyncHistory: (connectorId) => electron.ipcRenderer.invoke("kae:get-connector-sync-history", connectorId),
  getConnectorEvents: (connectorId) => electron.ipcRenderer.invoke("kae:get-connector-events", connectorId),
  selectFolder: () => electron.ipcRenderer.invoke("kae:select-folder"),
  onJobUpdated: (callback) => {
    const handler = (_event, job) => callback(job);
    electron.ipcRenderer.on("kae:job-updated", handler);
    return () => electron.ipcRenderer.removeListener("kae:job-updated", handler);
  },
  onLogAdded: (callback) => {
    const handler = (_event, entry) => callback(entry);
    electron.ipcRenderer.on("kae:log-added", handler);
    return () => electron.ipcRenderer.removeListener("kae:log-added", handler);
  },
  onImportComplete: (callback) => {
    const handler = (_event, summary) => callback(summary);
    electron.ipcRenderer.on("kae:import-complete", handler);
    return () => electron.ipcRenderer.removeListener("kae:import-complete", handler);
  },
  onImportTimeline: (callback) => {
    const handler = (_event, steps) => callback(steps);
    electron.ipcRenderer.on("kae:import-timeline", handler);
    return () => electron.ipcRenderer.removeListener("kae:import-timeline", handler);
  },
  onValidationProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    electron.ipcRenderer.on("kae:validation-progress", handler);
    return () => electron.ipcRenderer.removeListener("kae:validation-progress", handler);
  },
  onExecutiveBriefingUpdated: (callback) => {
    const handler = () => callback();
    electron.ipcRenderer.on("kae:executive-briefing-updated", handler);
    return () => electron.ipcRenderer.removeListener("kae:executive-briefing-updated", handler);
  },
  onExecutiveMemoryUpdated: (callback) => {
    const handler = () => callback();
    electron.ipcRenderer.on("kae:executive-memory-updated", handler);
    return () => electron.ipcRenderer.removeListener("kae:executive-memory-updated", handler);
  },
  onVigsyRefreshed: (callback) => {
    const handler = () => callback();
    electron.ipcRenderer.on("kae:vigsy-refreshed", handler);
    return () => electron.ipcRenderer.removeListener("kae:vigsy-refreshed", handler);
  },
  onReasoningStreamChunk: (callback) => {
    const handler = (_event, chunk) => callback(chunk);
    electron.ipcRenderer.on("kae:reasoning-stream-chunk", handler);
    return () => electron.ipcRenderer.removeListener("kae:reasoning-stream-chunk", handler);
  }
};
electron.contextBridge.exposeInMainWorld("kae", kaeAPI);

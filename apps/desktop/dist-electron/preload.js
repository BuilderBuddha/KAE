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
  }
};
electron.contextBridge.exposeInMainWorld("kae", kaeAPI);

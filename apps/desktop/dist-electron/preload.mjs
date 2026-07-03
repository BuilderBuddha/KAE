"use strict";
const electron = require("electron");
const scooperAPI = {
  getImporters: () => electron.ipcRenderer.invoke("scooper:get-importers"),
  getRepositoryConfig: () => electron.ipcRenderer.invoke("scooper:get-repository-config"),
  setRepositoryConfig: (config) => electron.ipcRenderer.invoke("scooper:set-repository-config", config),
  getSettings: () => electron.ipcRenderer.invoke("scooper:get-settings"),
  setSettings: (settings) => electron.ipcRenderer.invoke("scooper:set-settings", settings),
  getJobs: () => electron.ipcRenderer.invoke("scooper:get-jobs"),
  getLogs: () => electron.ipcRenderer.invoke("scooper:get-logs"),
  getDefaultRepositoryPath: () => electron.ipcRenderer.invoke("scooper:get-default-repository-path"),
  selectZipFile: () => electron.ipcRenderer.invoke("scooper:select-zip-file"),
  importChatGptZip: (filePath) => electron.ipcRenderer.invoke("scooper:import-chatgpt-zip", filePath),
  onJobUpdated: (callback) => {
    const handler = (_event, job) => callback(job);
    electron.ipcRenderer.on("scooper:job-updated", handler);
    return () => electron.ipcRenderer.removeListener("scooper:job-updated", handler);
  },
  onLogAdded: (callback) => {
    const handler = (_event, entry) => callback(entry);
    electron.ipcRenderer.on("scooper:log-added", handler);
    return () => electron.ipcRenderer.removeListener("scooper:log-added", handler);
  },
  onImportComplete: (callback) => {
    const handler = (_event, summary) => callback(summary);
    electron.ipcRenderer.on("scooper:import-complete", handler);
    return () => electron.ipcRenderer.removeListener("scooper:import-complete", handler);
  }
};
electron.contextBridge.exposeInMainWorld("scooper", scooperAPI);

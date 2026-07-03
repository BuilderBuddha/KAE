import type { AppSettings, RepositoryConfig, LogEntry, ImportJob } from '@scooper/core';
export interface ImporterInfo {
    id: string;
    name: string;
    description: string;
    supportedExtensions: readonly string[];
}
export interface ScooperAPI {
    getImporters: () => Promise<ImporterInfo[]>;
    getRepositoryConfig: () => Promise<RepositoryConfig>;
    setRepositoryConfig: (config: RepositoryConfig) => Promise<RepositoryConfig>;
    getSettings: () => Promise<AppSettings>;
    setSettings: (settings: AppSettings) => Promise<AppSettings>;
    getJobs: () => Promise<ImportJob[]>;
    getLogs: () => Promise<LogEntry[]>;
    getDefaultRepositoryPath: () => Promise<string>;
}
declare global {
    interface Window {
        scooper: ScooperAPI;
    }
}
//# sourceMappingURL=preload.d.ts.map
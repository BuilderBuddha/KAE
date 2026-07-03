import type { AppSettings, RepositoryConfig } from '../types/index.js';

/** Default path for the Axiom Knowledge Repository. */
export const DEFAULT_REPOSITORY_PATH = 'C:\\Users\\alber\\Axiom-Knowledge';

/** Default application settings. */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  logLevel: 'info',
  maxConcurrentJobs: 2,
  outputDirectory: './output',
};

/** Default repository configuration. */
export const DEFAULT_REPOSITORY_CONFIG: RepositoryConfig = {
  path: DEFAULT_REPOSITORY_PATH,
  name: 'Axiom Knowledge',
  autoSync: false,
};

/** Application configuration aggregate. */
export interface KaeConfig {
  repository: RepositoryConfig;
  settings: AppSettings;
}

/** @deprecated Use KaeConfig */
export type ScooperConfig = KaeConfig;

/** Returns the default KAE configuration. */
export function createDefaultConfig(): KaeConfig {
  return {
    repository: { ...DEFAULT_REPOSITORY_CONFIG },
    settings: { ...DEFAULT_APP_SETTINGS },
  };
}

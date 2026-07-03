/** Unique identifier for a knowledge source. */
export type SourceId = string;

/** Unique identifier for an import job. */
export type JobId = string;

/** Supported importer format identifiers. */
export type ImporterFormatId =
  | 'chatgpt-export-zip'
  | 'pdf'
  | 'markdown'
  | 'html'
  | 'docx'
  | 'txt';

/** Lifecycle status of an import job. */
export type JobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Log severity levels. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Reference to a file or directory on disk. */
export interface FileReference {
  path: string;
  name: string;
  extension?: string;
  sizeBytes?: number;
}

/** Parsed document fragment produced by the parser layer. */
export interface ParsedDocument {
  id: string;
  title: string;
  content: string;
  format: ImporterFormatId;
  metadata: Record<string, unknown>;
  sections?: ParsedSection[];
}

/** A section within a parsed document. */
export interface ParsedSection {
  id: string;
  title?: string;
  content: string;
  level: number;
}

/** Knowledge node for the graph layer. */
export interface KnowledgeNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

/** Directed edge between knowledge nodes. */
export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  properties?: Record<string, unknown>;
}

/** In-memory knowledge graph snapshot. */
export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

/** Application log entry. */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
}

/** Repository connection settings. */
export interface RepositoryConfig {
  path: string;
  name: string;
  autoSync: boolean;
}

/** Global application settings. */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  logLevel: LogLevel;
  maxConcurrentJobs: number;
  outputDirectory: string;
}

/** Result of an import operation. */
export interface ImportResult {
  jobId: JobId;
  success: boolean;
  documents: ParsedDocument[];
  graph?: KnowledgeGraph;
  errors?: string[];
  summary?: ImportSummary;
}

/** Summary statistics returned after an import completes. */
export interface ImportSummary {
  conversationsFound: number;
  sourcesCreated: number;
  skippedDuplicates: number;
  errors: string[];
  outputFolder: string;
  createdSourceIds: string[];
  classified?: number;
  uncertain?: number;
  reviewFile?: string;
  durationMs?: number;
  connectorId?: string;
  connectorName?: string;
  sessionsCreated?: number;
  snapshotPath?: string;
  importReportPath?: string;
  gitReadiness?: import('./import-rc.js').GitReadinessReport;
  timeline?: import('./import-rc.js').ImportTimelineStep[];
}

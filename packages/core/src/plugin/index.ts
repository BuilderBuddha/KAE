import type {
  FileReference,
  ImporterFormatId,
  ImportResult,
  JobId,
  ParsedDocument,
} from '../types/index.js';

/** Context passed to importer plugins during execution. */
export interface ImportContext {
  repositoryPath: string;
  outputDirectory: string;
  jobId?: JobId;
  signal?: AbortSignal;
  log?: (level: import('../types/index.js').LogLevel, message: string) => void;
  onProgress?: (progress: number) => void;
  /** Reuse validated import package — skips heavy ZIP re-extraction. */
  importPackage?: import('../connector/pipeline.js').ImportPackage;
  sourceZipPath?: string;
}

/** Contract for all importer plugins. */
export interface ImporterPlugin {
  readonly id: ImporterFormatId;
  readonly name: string;
  readonly description: string;
  readonly supportedExtensions: readonly string[];
  readonly supportedMimeTypes?: readonly string[];

  /** Returns true if this plugin can handle the given file reference. */
  canImport(file: FileReference): boolean;

  /** Phase 2+: execute import. Phase 1 stub throws NotImplemented. */
  import(file: FileReference, context: ImportContext): Promise<ImportResult>;
}

/** Contract for parser plugins that transform raw content. */
export interface ParserPlugin {
  readonly id: string;
  readonly name: string;
  readonly supportedFormats: readonly ImporterFormatId[];

  parse(content: string | Buffer, format: ImporterFormatId): Promise<ParsedDocument>;
}

/** Contract for exporter plugins that write to the repository. */
export interface ExporterPlugin {
  readonly id: string;
  readonly name: string;

  export(
    documents: ParsedDocument[],
    repositoryPath: string,
    context?: ExportContext,
  ): Promise<ExportResult>;
}

/** Context passed to exporter plugins during execution. */
export interface ExportContext {
  log?: (level: import('../types/index.js').LogLevel, message: string) => void;
  onProgress?: (progress: number) => void;
  importFileName?: string;
  /** Source ZIP path for deferred asset extraction at write time. */
  sourceZipPath?: string;
}

/** Result of exporting documents to a repository. */
export interface ExportResult {
  sourcesCreated: number;
  skippedDuplicates: number;
  errors: string[];
  outputFolder: string;
  createdSourceIds: string[];
  classified?: number;
  uncertain?: number;
  reviewFile?: string;
  sessionsCreated?: number;
}

/** Registry contract for plugin collections. */
export interface PluginRegistry<T> {
  register(plugin: T): void;
  unregister(id: string): void;
  get(id: string): T | undefined;
  getAll(): T[];
}

/** Base error for unimplemented Phase 1 stubs. */
export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented yet (Phase 1 architecture only).`);
    this.name = 'NotImplementedError';
  }
}

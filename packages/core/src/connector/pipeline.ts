import type { FileReference, ParsedDocument } from '../types/index.js';
import type { ConversationClassification } from '../types/classification.js';

/** Connector identifier. */
export type ConnectorId = string;

/** Pipeline stage identifiers. */
export type ConnectorStage =
  | 'discover'
  | 'extract'
  | 'normalize'
  | 'validate'
  | 'classify'
  | 'provenance'
  | 'source-record'
  | 'emit';

/** Result of source discovery. */
export interface DiscoveredSource {
  connectorId: ConnectorId;
  source: FileReference;
  format: string;
  metadata: Record<string, unknown>;
}

/** Raw extracted content from a source. */
export interface ExtractedContent {
  connectorId: ConnectorId;
  source: FileReference;
  rawDocuments: unknown[];
  assets: Array<{ path: string; fileName: string; dataBase64?: string }>;
  metadata: Record<string, unknown>;
}

/** Normalized document ready for validation. */
export interface NormalizedDocument {
  id: string;
  title: string;
  content: string;
  format: string;
  metadata: Record<string, unknown>;
}

/** Provenance record for an acquired knowledge item. */
export interface ProvenanceRecord {
  id: string;
  connectorId: ConnectorId;
  sourceFile: string;
  acquiredAt: string;
  conversationId?: string;
  checksum?: string;
  metadata: Record<string, unknown>;
}

/** Complete import package emitted by a connector pipeline. */
export interface ImportPackage {
  connectorId: ConnectorId;
  source: FileReference;
  documents: ParsedDocument[];
  provenance: ProvenanceRecord[];
  classifications: Map<string, ConversationClassification>;
  metadata: Record<string, unknown>;
}

/** Standard knowledge connector contract. */
export interface KnowledgeConnector {
  readonly id: ConnectorId;
  readonly name: string;
  readonly description: string;
  readonly supportedExtensions: readonly string[];

  canHandle(file: FileReference): boolean;
  discover(source: FileReference): Promise<DiscoveredSource>;
  extract(discovered: DiscoveredSource): Promise<ExtractedContent>;
  normalize(extracted: ExtractedContent): Promise<NormalizedDocument[]>;
}

/** Connector execution context. */
export interface ConnectorContext {
  repositoryPath: string;
  jobId?: string;
  signal?: AbortSignal;
  log?: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void;
  onProgress?: (stage: ConnectorStage, progress: number) => void;
}

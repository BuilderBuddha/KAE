import type { FileReference, ParsedDocument } from '../types/index.js';
import type { ConnectorContext, ConnectorId, KnowledgeConnector } from './pipeline.js';

/** Connector implementation maturity. */
export type ConnectorImplementationStatus = 'full' | 'stub';

/** Declared acquisition capabilities for a connector. */
export interface ConnectorCapabilities {
  implementationStatus: ConnectorImplementationStatus;
  supportsScheduledSync: boolean;
  supportsOAuth: boolean;
  supportsApiKey: boolean;
  supportsFilePicker: boolean;
  supportsUrlInput: boolean;
  supportsFolderPicker: boolean;
  acquisitionModes: readonly string[];
}

/** Persisted connector configuration. */
export interface ConnectorConfig {
  connectorId: ConnectorId;
  enabled: boolean;
  connected: boolean;
  scheduleIntervalMinutes?: number;
  scheduledSyncEnabled: boolean;
  settings: Record<string, unknown>;
}

/** Authentication state for a connector. */
export interface ConnectorAuth {
  type: 'none' | 'api_key' | 'oauth' | 'token';
  configured: boolean;
  label?: string;
}

/** Health snapshot for a connector. */
export interface ConnectorHealth {
  connectorId: ConnectorId;
  status: 'healthy' | 'degraded' | 'unavailable' | 'disconnected' | 'error';
  message: string;
  lastCheckedAt: string;
}

/** Connector sync job record. */
export interface ConnectorJob {
  jobId: string;
  connectorId: ConnectorId;
  startedAt: string;
  completedAt?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  itemsProcessed: number;
  error?: string;
}

/** Result of a connector sync operation. */
export interface ConnectorResult {
  success: boolean;
  connectorId: ConnectorId;
  itemsImported: number;
  itemsUpdated: number;
  itemsSkipped: number;
  documents: ParsedDocument[];
  errors: string[];
  durationMs: number;
  evidenceIndexBuiltAt?: string;
  relationshipIndexBuiltAt?: string;
  briefingGeneratedAt?: string;
}

/** Connector monitoring event names persisted for audit and UI status. */
export type ConnectorEventType =
  | 'checked'
  | 'change_detected'
  | 'acquired'
  | 'skipped_duplicate'
  | 'failed'
  | 'awareness_refreshed';

/** Persisted connector event log entry. */
export interface ConnectorEvent {
  eventId: string;
  connectorId: ConnectorId;
  type: ConnectorEventType;
  timestamp: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/** Lightweight source change detection result. */
export interface ConnectorChangeDetection {
  connectorId: ConnectorId;
  checkedAt: string;
  cursor: string;
  changeKeys: string[];
  summary: string;
}

/** Persistent monitoring status for a connector. */
export interface ConnectorMonitoringRecord {
  connectorId: ConnectorId;
  active: boolean;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  lastChangeDetectedAt?: string;
  lastSuccessfulAutoSyncAt?: string;
  lastCursor?: string;
  lastChangeKeys?: string[];
}

/** Historical sync entry for a connector. */
export interface SyncHistoryEntry {
  syncId: string;
  connectorId: ConnectorId;
  startedAt: string;
  completedAt: string;
  success: boolean;
  itemsImported: number;
  itemsUpdated: number;
  itemsSkipped: number;
  error?: string;
}

/** Runtime connector state shown in Connector Manager. */
export interface ConnectorStatus {
  connectorId: ConnectorId;
  name: string;
  description: string;
  capabilities: ConnectorCapabilities;
  config: ConnectorConfig;
  health: ConnectorHealth;
  auth: ConnectorAuth;
  lastSyncAt?: string;
  itemsImported: number;
  implementationStatus: ConnectorImplementationStatus;
  monitoring: ConnectorMonitoringRecord;
}

/** Extended sync context passed to connectors. */
export interface ConnectorSyncContext extends ConnectorContext {
  config: ConnectorConfig;
  auth?: ConnectorAuth;
}

/** Full connector contract — knowledge pipeline plus sync lifecycle. */
export interface Connector extends KnowledgeConnector {
  readonly capabilities: ConnectorCapabilities;
  getDefaultConfig(): ConnectorConfig;
  connect(config: ConnectorConfig, context: ConnectorContext): Promise<ConnectorHealth>;
  disconnect(): Promise<void>;
  sync(source: FileReference | null, context: ConnectorSyncContext): Promise<ConnectorResult>;
  checkHealth(context: ConnectorContext): Promise<ConnectorHealth>;
  detectChanges?(context: ConnectorSyncContext): Promise<ConnectorChangeDetection>;
}

/** Scheduler tick configuration. */
export interface ConnectorSchedule {
  connectorId: ConnectorId;
  intervalMinutes: number;
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
}

/** Persisted connector framework state. */
export interface ConnectorFrameworkState {
  version: number;
  connectors: Record<ConnectorId, ConnectorConfig>;
  syncHistory: SyncHistoryEntry[];
  schedules: ConnectorSchedule[];
  totals: Record<ConnectorId, { itemsImported: number; lastSyncAt?: string }>;
  monitoring: Record<ConnectorId, ConnectorMonitoringRecord>;
  events: ConnectorEvent[];
}

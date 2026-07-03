import type {
  Connector,
  ConnectorAuth,
  ConnectorChangeDetection,
  ConnectorConfig,
  ConnectorContext,
  ConnectorEvent,
  ConnectorEventType,
  ConnectorFrameworkState,
  ConnectorHealth,
  ConnectorId,
  ConnectorMonitoringRecord,
  ConnectorJob,
  ConnectorResult,
  ConnectorSchedule,
  ConnectorStatus,
  ConnectorSyncContext,
  FileReference,
  SyncHistoryEntry,
} from '@scooper/core';
import { writeAxiomSources } from '@scooper/exporters';
import { loadConnectorState, saveConnectorState } from './persist.js';
import { refreshRepositoryAwareness } from './post-sync.js';
import { deduplicateDocuments } from './deduplication.js';
import { ConnectorScheduler } from './scheduler.js';
import { BackgroundConnectorWorker } from './worker.js';
import { runConnectorPipeline } from './pipeline.js';
import { allConnectors } from './connectors/index.js';

function nowIso(): string {
  return new Date().toISOString();
}

function defaultAuth(connector: Connector): ConnectorAuth {
  if (connector.capabilities.supportsApiKey) {
    return { type: 'api_key', configured: false, label: 'API Key' };
  }
  if (connector.capabilities.supportsOAuth) {
    return { type: 'oauth', configured: false, label: 'OAuth' };
  }
  return { type: 'none', configured: true };
}

/** Registry and lifecycle manager for KAE connectors. */
export class ConnectorManager {
  private connectors = new Map<ConnectorId, Connector>();
  private state: ConnectorFrameworkState | null = null;
  private repositoryPath = '';
  private onAwarenessRefreshed?: () => void;
  readonly scheduler: ConnectorScheduler;
  readonly worker: BackgroundConnectorWorker;

  constructor() {
    this.scheduler = new ConnectorScheduler((connectorId, context) =>
      this.monitorConnector(connectorId, context),
    );
    this.worker = new BackgroundConnectorWorker(this.scheduler);
    for (const connector of allConnectors) {
      this.connectors.set(connector.id, connector);
    }
  }

  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  get(connectorId: ConnectorId): Connector | undefined {
    return this.connectors.get(connectorId);
  }

  list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  async initialize(repositoryPath: string): Promise<void> {
    this.repositoryPath = repositoryPath;
    this.state = await loadConnectorState(repositoryPath);
    for (const connector of this.connectors.values()) {
      if (!this.state.connectors[connector.id]) {
        this.state.connectors[connector.id] = connector.getDefaultConfig();
      }
      if (!this.state.monitoring[connector.id]) {
        this.state.monitoring[connector.id] = this.defaultMonitoringRecord(connector.id);
      }
    }
    this.worker.start(this.state.schedules);
    for (const config of Object.values(this.state.connectors)) {
      if (config.connected && config.scheduledSyncEnabled && config.scheduleIntervalMinutes) {
        this.worker.schedule(config.connectorId, config.scheduleIntervalMinutes);
        this.state.monitoring[config.connectorId] = {
          ...this.monitoringFor(config.connectorId),
          active: true,
          nextCheckAt: this.nextCheckAt(config.scheduleIntervalMinutes),
        };
      }
    }
    this.state.schedules = this.worker.getSchedules();
    await saveConnectorState(repositoryPath, this.state);
  }

  setAwarenessRefreshHandler(handler: () => void): void {
    this.onAwarenessRefreshed = handler;
  }

  private ensureState(): ConnectorFrameworkState {
    if (!this.state) {
      throw new Error('ConnectorManager not initialized.');
    }
    return this.state;
  }

  private configFor(connectorId: ConnectorId): ConnectorConfig {
    const state = this.ensureState();
    const connector = this.get(connectorId);
    return state.connectors[connectorId] ?? connector?.getDefaultConfig() ?? {
      connectorId,
      enabled: false,
      connected: false,
      scheduledSyncEnabled: false,
      settings: {},
    };
  }

  async getStatuses(context?: ConnectorContext): Promise<ConnectorStatus[]> {
    const state = this.ensureState();
    const ctx = this.buildContext(context);
    const statuses: ConnectorStatus[] = [];

    for (const connector of this.connectors.values()) {
      const config = this.configFor(connector.id);
      const totals = state.totals[connector.id] ?? { itemsImported: 0 };
      const health = config.connected
        ? await connector.checkHealth(ctx)
        : {
            connectorId: connector.id,
            status: 'disconnected' as const,
            message: 'Not connected',
            lastCheckedAt: nowIso(),
          };

      statuses.push({
        connectorId: connector.id,
        name: connector.name,
        description: connector.description,
        capabilities: connector.capabilities,
        config,
        health,
        auth: defaultAuth(connector),
        lastSyncAt: totals.lastSyncAt,
        itemsImported: totals.itemsImported,
        implementationStatus: connector.capabilities.implementationStatus,
        monitoring: this.monitoringFor(connector.id),
      });
    }

    return statuses;
  }

  async connect(
    connectorId: ConnectorId,
    config: Partial<ConnectorConfig>,
    context?: ConnectorContext,
  ): Promise<ConnectorHealth> {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

    const state = this.ensureState();
    const merged: ConnectorConfig = {
      ...this.configFor(connectorId),
      ...config,
      connectorId,
      connected: true,
      enabled: true,
    };
    const ctx = this.buildContext(context);
    const health = await connector.connect(merged, ctx);
    state.connectors[connectorId] = merged;
    if (merged.scheduledSyncEnabled && merged.scheduleIntervalMinutes) {
      this.worker.schedule(connectorId, merged.scheduleIntervalMinutes);
      state.schedules = this.worker.getSchedules();
      state.monitoring[connectorId] = {
        ...this.monitoringFor(connectorId),
        active: true,
        nextCheckAt: this.nextCheckAt(merged.scheduleIntervalMinutes),
      };
    }
    await saveConnectorState(this.repositoryPath, state);
    return health;
  }

  async disconnect(connectorId: ConnectorId): Promise<void> {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

    const state = this.ensureState();
    await connector.disconnect();
    const config = this.configFor(connectorId);
    state.connectors[connectorId] = { ...config, connected: false };
    this.worker.unschedule(connectorId);
    state.schedules = this.worker.getSchedules();
    state.monitoring[connectorId] = {
      ...this.monitoringFor(connectorId),
      active: false,
      nextCheckAt: undefined,
    };
    await saveConnectorState(this.repositoryPath, state);
  }

  async updateConfig(
    connectorId: ConnectorId,
    config: Partial<ConnectorConfig>,
  ): Promise<ConnectorConfig> {
    const state = this.ensureState();
    const current = this.configFor(connectorId);
    const merged = { ...current, ...config, connectorId };
    state.connectors[connectorId] = merged;

    if (merged.scheduledSyncEnabled && merged.scheduleIntervalMinutes && merged.connected) {
      this.worker.schedule(connectorId, merged.scheduleIntervalMinutes);
      state.schedules = this.worker.getSchedules();
      state.monitoring[connectorId] = {
        ...this.monitoringFor(connectorId),
        active: true,
        nextCheckAt: this.nextCheckAt(merged.scheduleIntervalMinutes),
      };
    } else {
      this.worker.unschedule(connectorId);
      state.schedules = this.worker.getSchedules();
      state.monitoring[connectorId] = {
        ...this.monitoringFor(connectorId),
        active: false,
        nextCheckAt: undefined,
      };
    }

    await saveConnectorState(this.repositoryPath, state);
    return merged;
  }

  async syncNow(
    connectorId: ConnectorId,
    source: FileReference | null,
    context?: ConnectorContext,
    options?: { configOverride?: ConnectorConfig; automatic?: boolean },
  ): Promise<ConnectorResult> {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

    const state = this.ensureState();
    const config = options?.configOverride ?? this.configFor(connectorId);
    if (!config.connected) {
      throw new Error(`Connector "${connector.name}" is not connected.`);
    }

    const started = Date.now();
    const syncId = crypto.randomUUID();
    const ctx: ConnectorSyncContext = {
      ...this.buildContext(context),
      config,
      auth: defaultAuth(connector),
    };

    ctx.log?.('info', `${options?.automatic ? 'Auto-sync' : 'Sync'} started: ${connector.name}`);
    let result: ConnectorResult;

    try {
      result = await connector.sync(source, ctx);
      if (result.documents.length > 0) {
        const deduped = await deduplicateDocuments(this.repositoryPath, result.documents);
        result.itemsSkipped += result.documents.length - deduped.documents.length;
        result.documents = deduped.documents;

        if (deduped.documents.length > 0) {
          const exportResult = await writeAxiomSources(deduped.documents, this.repositoryPath, {
            importFileName: source?.name ?? `${connectorId}-sync`,
            log: (level: 'debug' | 'info' | 'warn' | 'error', message: string) =>
              ctx.log?.(level, message),
            onProgress: (progress: number) => ctx.onProgress?.('emit', progress),
          });
          result.itemsImported = exportResult.sourcesCreated;
          result.itemsUpdated = Math.max(
            deduped.updatedCount,
            exportResult.sourcesCreated === 0 && deduped.documents.length > 0
              ? deduped.documents.length
              : 0,
          );
          result.itemsSkipped += exportResult.skippedDuplicates;

          const awareness = await refreshRepositoryAwareness(this.repositoryPath);
          result.evidenceIndexBuiltAt = awareness.evidenceIndexBuiltAt;
          result.relationshipIndexBuiltAt = awareness.relationshipIndexBuiltAt;
          result.briefingGeneratedAt = awareness.briefingGeneratedAt;
          this.appendEvent(state, connectorId, 'awareness_refreshed', 'Evidence, relationships, and awareness refreshed', {
            evidenceIndexBuiltAt: awareness.evidenceIndexBuiltAt,
            relationshipIndexBuiltAt: awareness.relationshipIndexBuiltAt,
            briefingGeneratedAt: awareness.briefingGeneratedAt,
          });
          this.onAwarenessRefreshed?.();
        }
      }

      result.durationMs = Date.now() - started;
      result.success = result.errors.length === 0;
      if (result.itemsImported > 0 || result.itemsUpdated > 0) {
        this.appendEvent(state, connectorId, 'acquired', 'Connector content acquired', {
          imported: result.itemsImported,
          updated: result.itemsUpdated,
        });
      }
      if (result.itemsSkipped > 0 || result.itemsUpdated > 0) {
        this.appendEvent(state, connectorId, 'skipped_duplicate', 'Existing connector content was not duplicated', {
          skipped: result.itemsSkipped,
          updated: result.itemsUpdated,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result = {
        success: false,
        connectorId,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [message],
        durationMs: Date.now() - started,
      };
      this.appendEvent(state, connectorId, 'failed', message);
    }

    const entry: SyncHistoryEntry = {
      syncId,
      connectorId,
      startedAt: new Date(started).toISOString(),
      completedAt: nowIso(),
      success: result.success,
      itemsImported: result.itemsImported,
      itemsUpdated: result.itemsUpdated,
      itemsSkipped: result.itemsSkipped,
      error: result.errors[0],
    };
    state.syncHistory.unshift(entry);
    state.syncHistory = state.syncHistory.slice(0, 100);
    const totals = state.totals[connectorId] ?? { itemsImported: 0 };
    state.totals[connectorId] = {
      itemsImported: totals.itemsImported + result.itemsImported + result.itemsUpdated,
      lastSyncAt: entry.completedAt,
    };
    await saveConnectorState(this.repositoryPath, state);
    return result;
  }

  async monitorConnector(
    connectorId: ConnectorId,
    context?: ConnectorContext,
  ): Promise<ConnectorResult | null> {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

    const state = this.ensureState();
    const config = this.configFor(connectorId);
    if (!config.connected || !config.scheduledSyncEnabled) {
      state.monitoring[connectorId] = {
        ...this.monitoringFor(connectorId),
        active: false,
        nextCheckAt: undefined,
      };
      await saveConnectorState(this.repositoryPath, state);
      return null;
    }

    const ctx: ConnectorSyncContext = {
      ...this.buildContext(context),
      config,
      auth: defaultAuth(connector),
    };

    try {
      const detection = await this.detectChanges(connector, ctx);
      const previous = this.monitoringFor(connectorId);
      const previousKeys = new Set(previous.lastChangeKeys ?? []);
      const newKeys = detection.changeKeys.filter((key) => !previousKeys.has(key));
      const changed = Boolean(previous.lastCursor && detection.cursor !== previous.lastCursor);
      const nextCheckAt = this.nextCheckAt(config.scheduleIntervalMinutes);

      state.monitoring[connectorId] = {
        ...previous,
        active: true,
        lastCheckedAt: detection.checkedAt,
        nextCheckAt,
      };
      this.appendEvent(state, connectorId, 'checked', detection.summary, {
        cursor: detection.cursor,
        keys: detection.changeKeys,
      });

      if (!previous.lastCursor) {
        state.monitoring[connectorId] = {
          ...state.monitoring[connectorId],
          lastCursor: detection.cursor,
          lastChangeKeys: detection.changeKeys,
        };
        state.schedules = this.worker.getSchedules();
        await saveConnectorState(this.repositoryPath, state);
        return null;
      }

      if (!changed) {
        state.schedules = this.worker.getSchedules();
        await saveConnectorState(this.repositoryPath, state);
        return null;
      }

      const changedKeys = newKeys.length > 0 ? newKeys : detection.changeKeys;
      state.monitoring[connectorId] = {
        ...state.monitoring[connectorId],
        lastChangeDetectedAt: detection.checkedAt,
      };
      this.appendEvent(state, connectorId, 'change_detected', 'Connector source changed', {
        previousCursor: previous.lastCursor,
        cursor: detection.cursor,
        changedKeys,
      });

      const configOverride: ConnectorConfig = {
        ...config,
        settings: {
          ...config.settings,
          __changeKeys: changedKeys,
        },
      };
      const result = await this.syncNow(connectorId, null, ctx, {
        automatic: true,
        configOverride,
      });

      if (result.success) {
        state.monitoring[connectorId] = {
          ...this.monitoringFor(connectorId),
          active: true,
          lastCheckedAt: detection.checkedAt,
          nextCheckAt,
          lastCursor: detection.cursor,
          lastChangeKeys: detection.changeKeys,
          lastChangeDetectedAt: detection.checkedAt,
          lastSuccessfulAutoSyncAt: nowIso(),
        };
      }

      state.schedules = this.worker.getSchedules();
      await saveConnectorState(this.repositoryPath, state);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.appendEvent(state, connectorId, 'failed', message);
      await saveConnectorState(this.repositoryPath, state);
      return {
        success: false,
        connectorId,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [message],
        durationMs: 0,
      };
    }
  }

  async runPipeline(
    connectorId: ConnectorId,
    source: FileReference,
    context?: ConnectorContext,
  ): Promise<ConnectorResult> {
    const connector = this.get(connectorId);
    if (!connector) throw new Error(`Unknown connector: ${connectorId}`);

    const started = Date.now();
    const ctx = this.buildContext(context);
    try {
      const importPackage = await runConnectorPipeline(connector, source, ctx);
      return {
        success: true,
        connectorId,
        itemsImported: importPackage.documents.length,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: importPackage.documents,
        errors: [],
        durationMs: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        connectorId,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [message],
        durationMs: Date.now() - started,
      };
    }
  }

  getSyncHistory(connectorId?: ConnectorId): SyncHistoryEntry[] {
    const state = this.ensureState();
    if (!connectorId) return state.syncHistory;
    return state.syncHistory.filter((entry) => entry.connectorId === connectorId);
  }

  getEvents(connectorId?: ConnectorId): ConnectorEvent[] {
    const state = this.ensureState();
    if (!connectorId) return state.events;
    return state.events.filter((event) => event.connectorId === connectorId);
  }

  getSchedules(): ConnectorSchedule[] {
    return this.worker.getSchedules();
  }

  stopMonitoring(): void {
    this.worker.stop();
  }

  createJob(connectorId: ConnectorId): ConnectorJob {
    return {
      jobId: crypto.randomUUID(),
      connectorId,
      startedAt: nowIso(),
      status: 'queued',
      progress: 0,
      itemsProcessed: 0,
    };
  }

  private buildContext(context?: ConnectorContext): ConnectorContext {
    return {
      repositoryPath: this.repositoryPath,
      ...context,
    };
  }

  private defaultMonitoringRecord(connectorId: ConnectorId): ConnectorMonitoringRecord {
    return {
      connectorId,
      active: false,
    };
  }

  private monitoringFor(connectorId: ConnectorId): ConnectorMonitoringRecord {
    const state = this.ensureState();
    return state.monitoring[connectorId] ?? this.defaultMonitoringRecord(connectorId);
  }

  private nextCheckAt(intervalMinutes = 60): string {
    return new Date(Date.now() + intervalMinutes * 60_000).toISOString();
  }

  private appendEvent(
    state: ConnectorFrameworkState,
    connectorId: ConnectorId,
    type: ConnectorEventType,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    state.events.unshift({
      eventId: crypto.randomUUID(),
      connectorId,
      type,
      timestamp: nowIso(),
      message,
      metadata,
    });
    state.events = state.events.slice(0, 500);
  }

  private async detectChanges(
    connector: Connector,
    context: ConnectorSyncContext,
  ): Promise<ConnectorChangeDetection> {
    if (connector.detectChanges) {
      return connector.detectChanges(context);
    }
    const cursor = JSON.stringify(context.config.settings ?? {});
    return {
      connectorId: connector.id,
      checkedAt: nowIso(),
      cursor,
      changeKeys: [cursor],
      summary: `${connector.name} checked`,
    };
  }
}

let sharedManager: ConnectorManager | null = null;

export function getSharedConnectorManager(): ConnectorManager {
  if (!sharedManager) {
    sharedManager = new ConnectorManager();
  }
  return sharedManager;
}

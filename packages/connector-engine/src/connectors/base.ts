import type {
  Connector,
  ConnectorCapabilities,
  ConnectorConfig,
  ConnectorContext,
  ConnectorHealth,
  ConnectorResult,
  ConnectorSyncContext,
  DiscoveredSource,
  ExtractedContent,
  FileReference,
  NormalizedDocument,
  ParsedDocument,
} from '@scooper/core';
import { runConnectorPipeline } from '../pipeline.js';

export function healthy(connectorId: string, message: string): ConnectorHealth {
  return {
    connectorId,
    status: 'healthy',
    message,
    lastCheckedAt: new Date().toISOString(),
  };
}

export function disconnected(connectorId: string): ConnectorHealth {
  return {
    connectorId,
    status: 'disconnected',
    message: 'Not connected',
    lastCheckedAt: new Date().toISOString(),
  };
}

export abstract class BaseConnector implements Connector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly supportedExtensions: readonly string[];
  abstract readonly capabilities: ConnectorCapabilities;

  abstract getDefaultConfig(): ConnectorConfig;
  abstract discover(source: FileReference): Promise<DiscoveredSource>;
  abstract extract(discovered: DiscoveredSource): Promise<ExtractedContent>;
  abstract normalize(extracted: ExtractedContent): Promise<NormalizedDocument[]>;
  abstract syncInternal(
    source: FileReference | null,
    context: ConnectorSyncContext,
  ): Promise<ParsedDocument[]>;

  canHandle(file: FileReference): boolean {
    const ext = file.extension?.toLowerCase() ?? '';
    return this.supportedExtensions.some((supported) => supported.toLowerCase() === ext);
  }

  async connect(_config: ConnectorConfig, _context: ConnectorContext): Promise<ConnectorHealth> {
    return healthy(this.id, `${this.name} connected`);
  }

  async disconnect(): Promise<void> {
    // no-op by default
  }

  async checkHealth(_context: ConnectorContext): Promise<ConnectorHealth> {
    return healthy(this.id, `${this.name} is operational`);
  }

  async sync(source: FileReference | null, context: ConnectorSyncContext): Promise<ConnectorResult> {
    const started = Date.now();
    const errors: string[] = [];
    try {
      let documents: ParsedDocument[];
      if (source && this.canHandle(source)) {
        const importPackage = await runConnectorPipeline(this, source, context);
        documents = importPackage.documents;
      } else {
        documents = await this.syncInternal(source, context);
      }
      return {
        success: true,
        connectorId: this.id,
        itemsImported: documents.length,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents,
        errors,
        durationMs: Date.now() - started,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      context.log?.('error', message);
      return {
        success: false,
        connectorId: this.id,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors,
        durationMs: Date.now() - started,
      };
    }
  }
}

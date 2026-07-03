import type {
  ExporterPlugin,
  ParsedDocument,
  PluginRegistry,
} from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** In-memory exporter plugin registry. */
export class ExporterRegistry implements PluginRegistry<ExporterPlugin> {
  private plugins = new Map<string, ExporterPlugin>();

  register(plugin: ExporterPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  get(id: string): ExporterPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): ExporterPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const exporterRegistry = new ExporterRegistry();

/** Abstract base for exporter plugins. */
export abstract class BaseExporter implements ExporterPlugin {
  abstract readonly id: string;
  abstract readonly name: string;

  async export(
    _documents: ParsedDocument[],
    _repositoryPath: string,
    _context?: import('@scooper/core').ExportContext,
  ): Promise<import('@scooper/core').ExportResult> {
    throw new NotImplementedError(`Exporter "${this.name}"`);
  }
}

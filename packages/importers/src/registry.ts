import type {
  FileReference,
  ImportContext,
  ImportResult,
  ImporterFormatId,
  ImporterPlugin,
  PluginRegistry,
} from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** Abstract base class for importer plugins. */
export abstract class BaseImporter implements ImporterPlugin {
  abstract readonly id: ImporterFormatId;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly supportedExtensions: readonly string[];

  canImport(file: FileReference): boolean {
    const ext = file.extension?.toLowerCase() ?? '';
    return this.supportedExtensions.some((e) => e.toLowerCase() === ext);
  }

  async import(_file: FileReference, _context: ImportContext): Promise<ImportResult> {
    throw new NotImplementedError(`Importer "${this.name}"`);
  }
}

/** In-memory importer plugin registry. */
export class ImporterRegistry implements PluginRegistry<ImporterPlugin> {
  private plugins = new Map<ImporterFormatId, ImporterPlugin>();

  register(plugin: ImporterPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id as ImporterFormatId);
  }

  get(id: string): ImporterPlugin | undefined {
    return this.plugins.get(id as ImporterFormatId);
  }

  getAll(): ImporterPlugin[] {
    return Array.from(this.plugins.values());
  }

  findForFile(file: FileReference): ImporterPlugin | undefined {
    return this.getAll().find((p) => p.canImport(file));
  }
}

export const importerRegistry = new ImporterRegistry();

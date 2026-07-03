import type { ImporterFormatId, ParserPlugin, PluginRegistry } from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** Abstract base for parser plugins. */
export abstract class BaseParser implements ParserPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly supportedFormats: readonly ImporterFormatId[];

  async parse(_content: string | Buffer, _format: ImporterFormatId): Promise<import('@scooper/core').ParsedDocument> {
    throw new NotImplementedError(`Parser "${this.name}"`);
  }
}

/** In-memory parser plugin registry. */
export class ParserRegistry implements PluginRegistry<ParserPlugin> {
  private plugins = new Map<string, ParserPlugin>();

  register(plugin: ParserPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  get(id: string): ParserPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): ParserPlugin[] {
    return Array.from(this.plugins.values());
  }

  getForFormat(format: ImporterFormatId): ParserPlugin | undefined {
    return this.getAll().find((p) => p.supportedFormats.includes(format));
  }
}

export const parserRegistry = new ParserRegistry();

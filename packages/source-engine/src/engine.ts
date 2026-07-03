import type { FileReference, ImporterFormatId, SourceId } from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** Resolved source ready for import pipeline. */
export interface ResolvedSource {
  id: SourceId;
  file: FileReference;
  format: ImporterFormatId;
  resolvedAt: string;
}

/** Source resolution engine contract. */
export interface SourceEngine {
  resolve(file: FileReference): Promise<ResolvedSource>;
  resolveBatch(files: FileReference[]): Promise<ResolvedSource[]>;
}

/** Phase 1 stub source engine. */
export class StubSourceEngine implements SourceEngine {
  async resolve(_file: FileReference): Promise<ResolvedSource> {
    throw new NotImplementedError('Source resolution');
  }

  async resolveBatch(_files: FileReference[]): Promise<ResolvedSource[]> {
    throw new NotImplementedError('Batch source resolution');
  }
}

/** Infer format from file extension (Phase 1 helper). */
export function inferFormatFromExtension(ext: string): ImporterFormatId | undefined {
  const map: Record<string, ImporterFormatId> = {
    '.zip': 'chatgpt-export-zip',
    '.pdf': 'pdf',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.html': 'html',
    '.htm': 'html',
    '.docx': 'docx',
    '.txt': 'txt',
  };
  return map[ext.toLowerCase()];
}

export const sourceEngine: SourceEngine = new StubSourceEngine();

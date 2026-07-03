import type { ImporterFormatId, ParsedDocument } from '@scooper/core';
import { NotImplementedError } from '@scooper/core';

/** Detected capability from parsed content. */
export interface Capability {
  id: string;
  type: string;
  label: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** Capability detection engine contract. */
export interface CapabilityEngine {
  detect(document: ParsedDocument): Promise<Capability[]>;
  detectBatch(documents: ParsedDocument[]): Promise<Map<string, Capability[]>>;
}

/** Phase 1 stub capability engine. */
export class StubCapabilityEngine implements CapabilityEngine {
  async detect(_document: ParsedDocument): Promise<Capability[]> {
    throw new NotImplementedError('Capability detection');
  }

  async detectBatch(_documents: ParsedDocument[]): Promise<Map<string, Capability[]>> {
    throw new NotImplementedError('Batch capability detection');
  }
}

/** Returns supported format capabilities metadata (Phase 1). */
export function getFormatCapabilities(format: ImporterFormatId): string[] {
  const capabilities: Record<ImporterFormatId, string[]> = {
    'chatgpt-export-zip': ['conversation', 'message-thread', 'metadata'],
    youtube: ['video', 'transcript', 'metadata', 'channel'],
    github: ['repository', 'readme', 'issue', 'pull-request', 'commit', 'release'],
    'local-folder': ['document', 'markdown', 'text-file'],
    pdf: ['document', 'section', 'text-block'],
    markdown: ['heading', 'code-block', 'link'],
    html: ['element', 'link', 'heading'],
    docx: ['paragraph', 'heading', 'table'],
    txt: ['paragraph', 'line'],
  };
  return capabilities[format] ?? [];
}

export const capabilityEngine: CapabilityEngine = new StubCapabilityEngine();

import fs from 'node:fs/promises';
import path from 'node:path';
import type { ConnectorSyncContext, FileReference, ParsedDocument } from '@scooper/core';
import { BaseConnector } from './base.js';

const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.txt'] as const;

async function listFilesRecursive(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursive(fullPath)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
      results.push(fullPath);
    }
  }
  return results;
}

function buildLocalFolderDocument(rootDir: string, filePath: string, content: string): ParsedDocument {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const sourceKey = `local-folder:${relativePath}`;
  const title = path.basename(filePath, path.extname(filePath));

  const lines = [
    `# ${title}`,
    '',
    '## Source',
    'Local Folder',
    '',
    '## Relative Path',
    relativePath,
    '',
    '## Content',
    content,
    '',
    '## ChatGPT Conversation ID',
    sourceKey,
  ];

  return {
    id: sourceKey,
    title,
    content: lines.join('\n'),
    format: 'local-folder',
    metadata: {
      conversationId: sourceKey,
      sourceKey,
      connectorId: 'local-folder',
      relativePath,
      messageCount: 1,
    },
  };
}

/** Local Folder connector — acquire markdown and text files from a directory. */
export class LocalFolderConnector extends BaseConnector {
  readonly id = 'local-folder';
  readonly name = 'Local Folder Connector';
  readonly description = 'Acquire knowledge from markdown and text files in a local directory.';
  readonly supportedExtensions = SUPPORTED_EXTENSIONS;
  readonly capabilities = {
    implementationStatus: 'full' as const,
    supportsScheduledSync: true,
    supportsOAuth: false,
    supportsApiKey: false,
    supportsFilePicker: false,
    supportsUrlInput: false,
    supportsFolderPicker: true,
    acquisitionModes: ['folder'] as const,
  };

  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: false,
      connected: false,
      scheduledSyncEnabled: false,
      settings: {
        folderPath: '',
      },
    };
  }

  canHandle(file: FileReference): boolean {
    return this.supportedExtensions.some(
      (ext) => ext === file.extension?.toLowerCase(),
    );
  }

  async discover(source: FileReference) {
    return {
      connectorId: this.id,
      source,
      format: 'local-folder',
      metadata: { path: source.path },
    };
  }

  async extract(discovered: import('@scooper/core').DiscoveredSource) {
    const content = await fs.readFile(discovered.source.path, 'utf8');
    return {
      connectorId: this.id,
      source: discovered.source,
      rawDocuments: [{ path: discovered.source.path, content }],
      assets: [],
      metadata: {},
    };
  }

  async normalize(extracted: import('@scooper/core').ExtractedContent) {
    const rootDir = path.dirname(extracted.source.path);
    return extracted.rawDocuments.map((raw) => {
      const item = raw as { path: string; content: string };
      const doc = buildLocalFolderDocument(rootDir, item.path, item.content);
      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        format: doc.format,
        metadata: doc.metadata,
      };
    });
  }

  async syncInternal(
    source: FileReference | null,
    context: ConnectorSyncContext,
  ): Promise<ParsedDocument[]> {
    const folderPath = String(
      source?.path ?? context.config.settings.folderPath ?? '',
    ).trim();
    if (!folderPath) {
      throw new Error('Local Folder connector requires a folder path.');
    }

    const files = await listFilesRecursive(folderPath);
    const documents: ParsedDocument[] = [];
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      documents.push(buildLocalFolderDocument(folderPath, filePath, content));
    }
    return documents;
  }
}

export const localFolderConnector = new LocalFolderConnector();

import type { FileReference, ImportPackage, LogLevel, ValidationProgress } from '@scooper/core';
import {
  emitImportPackage,
  generateProvenance,
  generateSourceRecords,
} from '@scooper/connector-engine';
import { conversationToDocument } from './conversation-document.js';
import { extractChatGptZip } from './extract-zip.js';
import {
  parseConversationsIncremental,
  parseConversationsJsonArray,
} from './parse-conversations.js';
import { chatGptConnector } from './chatgpt-connector.js';

const STAGE_LABELS: Record<ValidationProgress['stage'], string> = {
  'zip-selected': 'ZIP selected',
  'zip-opening': 'Opening ZIP archive',
  'zip-opened': 'ZIP opened',
  'entries-discovered': 'Archive entries discovered',
  'conversations-json-located': 'conversations.json located',
  'parsing-started': 'Parsing conversations',
  'parsing-conversations': 'Processing conversations',
  'planning-import': 'Planning import (read-only)',
  completed: 'Validation complete',
  failed: 'Validation failed',
  cancelled: 'Validation cancelled',
};

export interface ValidationCallbacks {
  log?: (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) => void;
  onProgress?: (progress: ValidationProgress) => void;
  signal?: AbortSignal;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Validation cancelled by user.');
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Runs staged read-only ChatGPT validation with detailed logging and progress. */
export async function runChatGptValidationPipeline(
  file: FileReference,
  callbacks: ValidationCallbacks = {},
): Promise<ImportPackage> {
  const startedAt = Date.now();
  const warnings: string[] = [];
  let archiveEntryCount = 0;
  let conversationsJsonPath: string | undefined;
  let conversationsJsonSizeBytes: number | undefined;
  let conversationsTotal = 0;
  let conversationsProcessed = 0;
  let messagesProcessed = 0;

  const emit = (
    stage: ValidationProgress['stage'],
    status: ValidationProgress['status'],
    partial: Partial<ValidationProgress> = {},
  ): void => {
    callbacks.onProgress?.({
      status,
      stage,
      stageLabel: STAGE_LABELS[stage],
      fileName: file.name,
      archiveEntryCount,
      conversationsJsonPath,
      conversationsJsonSizeBytes,
      conversationsTotal,
      conversationsProcessed,
      messagesProcessed,
      warningsGenerated: warnings.length,
      startedAt: new Date(startedAt).toISOString(),
      elapsedMs: Date.now() - startedAt,
      ...partial,
    });
  };

  const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void => {
    callbacks.log?.(level, message, context);
  };

  try {
    emit('zip-selected', 'running', { detail: file.name });
    log('info', `ZIP selected: ${file.name}`, { path: file.path });

    emit('zip-opening', 'running');
    log('info', 'Opening ZIP archive (read-only)…');

    const extracted = extractChatGptZip(file.path, {
      loadAssetData: false,
      signal: callbacks.signal,
      callbacks: {
        onZipOpened: (entryCount) => {
          archiveEntryCount = entryCount;
          emit('zip-opened', 'running', {
            archiveEntryCount: entryCount,
            detail: `${entryCount} entries`,
          });
          log('info', `ZIP opened: ${entryCount} archive entries`);
        },
        onEntriesDiscovered: (fileCount, assetCount) => {
          emit('entries-discovered', 'running', {
            archiveEntryCount: fileCount,
            detail: `${assetCount} asset file(s), metadata only`,
          });
          log('info', `Archive entries discovered: ${fileCount} total, ${assetCount} asset file(s)`);
        },
        onConversationsJsonLocated: (entryPath, sizeBytes) => {
          conversationsJsonPath = entryPath;
          conversationsJsonSizeBytes = sizeBytes;
          emit('conversations-json-located', 'running', {
            conversationsJsonPath: entryPath,
            conversationsJsonSizeBytes: sizeBytes,
            detail: `${entryPath} (${formatBytes(sizeBytes)})`,
          });
          log('info', `conversations.json located: ${entryPath} (${formatBytes(sizeBytes)})`);
        },
      },
    });

    throwIfAborted(callbacks.signal);

    emit('parsing-started', 'running');
    log('info', 'Conversations parsing started…');

    const rawConversations = parseConversationsJsonArray(extracted.conversationsJson);
    conversationsTotal = rawConversations.length;
    log('info', `Total conversations detected: ${conversationsTotal}`, {
      conversationsTotal,
    });
    emit('parsing-started', 'running', {
      conversationsTotal,
      detail: `${conversationsTotal} conversations`,
    });

    const parsedConversations = await parseConversationsIncremental(rawConversations, {
      signal: callbacks.signal,
      onProgress: (progress) => {
        conversationsProcessed = progress.conversationsProcessed;
        messagesProcessed = progress.messagesProcessed;
        emit('parsing-conversations', 'running', {
          conversationsTotal: progress.conversationsTotal,
          conversationsProcessed: progress.conversationsProcessed,
          messagesProcessed: progress.messagesProcessed,
          detail: `${progress.conversationsProcessed}/${progress.conversationsTotal} conversations, ${progress.messagesProcessed} messages`,
        });
        if (
          progress.conversationsProcessed % 100 === 0 ||
          progress.conversationsProcessed === progress.conversationsTotal
        ) {
          log(
            'info',
            `Conversations processed: ${progress.conversationsProcessed}/${progress.conversationsTotal} (${progress.messagesProcessed} messages)`,
            {
              conversationsProcessed: progress.conversationsProcessed,
              conversationsTotal: progress.conversationsTotal,
              messagesProcessed: progress.messagesProcessed,
            },
          );
        }
      },
    });

    throwIfAborted(callbacks.signal);

    const assetList = extracted.assets.map((a) => ({
      zipPath: a.zipPath,
      fileName: a.fileName,
    }));

    const normalized = parsedConversations.map((conv, index) =>
      conversationToDocument(conv, extracted.assets, {
        validationMode: true,
        sharedAssetList: index === 0 ? assetList : undefined,
      }),
    );

    const documents = generateSourceRecords(chatGptConnector.id, normalized);
    const provenance = generateProvenance(chatGptConnector.id, file, documents);
    const importPackage = emitImportPackage(
      chatGptConnector,
      file,
      documents,
      provenance,
    );

    if (warnings.length > 0) {
      log('warn', `Warnings generated: ${warnings.length}`, { warnings });
    }

    emit('completed', 'complete', {
      conversationsTotal,
      conversationsProcessed,
      messagesProcessed,
      detail: `${conversationsProcessed} conversations validated`,
    });
    log('info', `Validation pipeline complete: ${documents.length} conversation(s), ${messagesProcessed} message(s)`);

    return importPackage;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cancelled = message.includes('cancelled');
    emit(cancelled ? 'cancelled' : 'failed', cancelled ? 'cancelled' : 'failed', {
      error: message,
      detail: message,
    });
    log(cancelled ? 'warn' : 'error', `Validation ${cancelled ? 'cancelled' : 'failed'}: ${message}`, {
      error: message,
    });
    throw err;
  }
}

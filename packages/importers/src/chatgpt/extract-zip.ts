import AdmZip from 'adm-zip';
import path from 'node:path';
import type { ZipAssetEntry } from './types.js';

const CONVERSATIONS_JSON = 'conversations.json';
const SKIP_ASSET_PATTERNS = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i,
];

export interface ExtractedZip {
  conversationsJson: string;
  conversationsPath: string;
  assets: ZipAssetEntry[];
  archiveEntryCount: number;
}

export interface ExtractZipCallbacks {
  onZipOpened?: (entryCount: number) => void;
  onEntriesDiscovered?: (fileCount: number, assetCount: number) => void;
  onConversationsJsonLocated?: (entryPath: string, sizeBytes: number) => void;
}

export interface ExtractZipOptions {
  /** When false, only asset paths/names are collected — buffers are not loaded. */
  loadAssetData?: boolean;
  signal?: AbortSignal;
  callbacks?: ExtractZipCallbacks;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Validation cancelled by user.');
  }
}

/** Reads and validates a ChatGPT export ZIP archive. */
export function extractChatGptZip(zipPath: string, options: ExtractZipOptions = {}): ExtractedZip {
  const { loadAssetData = true, signal, callbacks } = options;

  throwIfAborted(signal);
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  callbacks?.onZipOpened?.(entries.length);
  throwIfAborted(signal);

  const conversationsEntry = entries.find(
    (e) => !e.isDirectory && e.entryName.replace(/\\/g, '/').endsWith(CONVERSATIONS_JSON),
  );

  if (!conversationsEntry) {
    throw new Error(
      'Not a ChatGPT export ZIP: conversations.json was not found in the archive.',
    );
  }

  const conversationsPath = conversationsEntry.entryName.replace(/\\/g, '/');
  const conversationsJsonSize = conversationsEntry.header.size;
  callbacks?.onConversationsJsonLocated?.(conversationsPath, conversationsJsonSize);
  throwIfAborted(signal);

  const conversationsJson = conversationsEntry.getData().toString('utf8');
  const assets: ZipAssetEntry[] = [];
  let assetCandidateCount = 0;

  for (const entry of entries) {
    throwIfAborted(signal);
    if (entry.isDirectory) continue;
    const normalized = entry.entryName.replace(/\\/g, '/');
    const baseName = path.basename(normalized);
    if (SKIP_ASSET_PATTERNS.some((p) => p.test(baseName) || p.test(normalized))) continue;
    if (normalized.endsWith('.json') && !normalized.includes('/')) continue;

    assetCandidateCount++;
    const asset: ZipAssetEntry = {
      zipPath: normalized,
      fileName: baseName,
    };
    if (loadAssetData) {
      asset.data = entry.getData();
    }
    assets.push(asset);
  }

  callbacks?.onEntriesDiscovered?.(entries.length, assetCandidateCount);

  return {
    conversationsJson,
    conversationsPath,
    assets,
    archiveEntryCount: entries.length,
  };
}

export interface ZipAssetRef {
  zipPath: string;
  fileName: string;
}

/** Loads asset buffers from a ZIP on demand (single archive read). */
export function loadZipAssetsFromArchive(
  zipPath: string,
  assetRefs: ZipAssetRef[],
): ZipAssetEntry[] {
  if (assetRefs.length === 0) return [];

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const entryByPath = new Map<string, (typeof entries)[0]>();

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    entryByPath.set(entry.entryName.replace(/\\/g, '/'), entry);
  }

  const loaded: ZipAssetEntry[] = [];
  for (const ref of assetRefs) {
    const entry = entryByPath.get(ref.zipPath);
    if (!entry) continue;
    loaded.push({
      zipPath: ref.zipPath,
      fileName: ref.fileName,
      data: entry.getData(),
    });
  }

  return loaded;
}

/** Returns true if the file appears to be a ChatGPT export ZIP. */
export function isChatGptExportZip(zipPath: string): boolean {
  try {
    extractChatGptZip(zipPath, { loadAssetData: false });
    return true;
  } catch {
    return false;
  }
}

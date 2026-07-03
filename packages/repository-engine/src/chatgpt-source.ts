import fs from 'node:fs/promises';
import path from 'node:path';
import { browseRepository, readRepositoryFile } from './browse.js';

export const CHATGPT_IMPORT_KRC_MIN = 53;
export const CHATGPT_IMPORT_KRC_MAX = 122;

export interface ChatGptSourceMessage {
  role: string;
  timestamp?: string;
  text: string;
  fileReferences: string[];
}

export interface ResolvedChatGptAsset {
  ref: string;
  relativePath: string;
  fileName: string;
  mimeType: string;
  kind: 'image' | 'video' | 'other';
}

export interface ParsedChatGptSource {
  krcId: string;
  title: string;
  conversationId?: string;
  createTime?: string;
  updateTime?: string;
  description?: string;
  fileReferences: string[];
  messages: ChatGptSourceMessage[];
}

export interface ChatGptImportListEntry {
  name: string;
  relativePath: string;
  krcId: string;
  title: string;
  createTime?: string;
  updateTime?: string;
  sortTime: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

/** Reads title and timestamps from the source header without parsing messages. */
export function parseChatGptSourceTimes(content: string): {
  krcId?: string;
  title?: string;
  createTime?: string;
  updateTime?: string;
} {
  const header = content.slice(0, 4096);
  const titleMatch = header.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: titleMatch?.[1],
    title: titleMatch?.[2]?.trim(),
    createTime: extractSection(header, 'Create Time'),
    updateTime: extractSection(header, 'Update Time'),
  };
}

/** Lists imported ChatGPT sources sorted newest-first by conversation update time. */
export async function listChatGptImportEntries(
  repositoryPath: string,
): Promise<ChatGptImportListEntry[]> {
  const files = await browseRepository(repositoryPath);
  const imports = files.filter(
    (f) => f.category === 'sources' && isChatGptImportSourceFileName(f.name),
  );

  const entries: ChatGptImportListEntry[] = [];
  for (const file of imports) {
    let header = '';
    try {
      const full = await readRepositoryFile(repositoryPath, file.relativePath);
      header = full.slice(0, 4096);
    } catch {
      // skip unreadable
    }
    const meta = parseChatGptSourceTimes(header);
    const sortTime = meta.updateTime ?? meta.createTime ?? file.modifiedAt ?? '';
    entries.push({
      name: file.name,
      relativePath: file.relativePath,
      krcId: meta.krcId ?? file.name,
      title: meta.title ?? file.name.replace(/\.md$/i, ''),
      createTime: meta.createTime,
      updateTime: meta.updateTime,
      sortTime,
      sizeBytes: file.sizeBytes,
      modifiedAt: file.modifiedAt,
    });
  }

  return entries.sort(
    (a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime(),
  );
}

/** True for KRC-0053 … KRC-0122 ChatGPT import sources. */
export function isChatGptImportSourceFileName(fileName: string): boolean {
  const match = fileName.match(/^KRC-(\d{4})_/i);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= CHATGPT_IMPORT_KRC_MIN && num <= CHATGPT_IMPORT_KRC_MAX;
}

function extractSection(content: string, heading: string): string | undefined {
  const pattern = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, 'm');
  const match = content.match(pattern);
  return match?.[1]?.trim();
}

function parseListSection(section: string | undefined): string[] {
  if (!section) return [];
  return section
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

function parseMessageBlock(block: string): ChatGptSourceMessage | null {
  const lines = block.split('\n');
  const role = lines[0]?.trim();
  if (!role) return null;

  let timestamp: string | undefined;
  let bodyStart = 1;
  if (lines[1]?.startsWith('*') && lines[1]?.endsWith('*')) {
    timestamp = lines[1].slice(1, -1).trim();
    bodyStart = 2;
  }

  const rest = lines.slice(bodyStart).join('\n').trim();
  const fileSplit = rest.split(/\n\*\*File references:\*\*\s*\n/i);
  const text = fileSplit[0]?.trim() ?? '';
  const fileReferences: string[] = [];
  if (fileSplit[1]) {
    for (const line of fileSplit[1].split('\n')) {
      const ref = line.replace(/^-\s*/, '').trim();
      if (ref) fileReferences.push(ref);
    }
  }

  return { role, timestamp, text, fileReferences };
}

/** Parses a KAE ChatGPT source markdown file. */
export function parseChatGptSourceMarkdown(content: string): ParsedChatGptSource | null {
  const titleMatch = content.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!titleMatch) return null;

  const transcriptIdx = content.indexOf('## Transcript');
  const header = transcriptIdx >= 0 ? content.slice(0, transcriptIdx) : content;
  const transcript = transcriptIdx >= 0 ? content.slice(transcriptIdx + '## Transcript'.length) : '';

  const messages: ChatGptSourceMessage[] = [];
  for (const block of transcript.split(/^### /m).slice(1)) {
    const parsed = parseMessageBlock(block);
    if (parsed) messages.push(parsed);
  }

  return {
    krcId: titleMatch[1],
    title: titleMatch[2].trim(),
    conversationId: extractSection(header, 'ChatGPT Conversation ID'),
    createTime: extractSection(header, 'Create Time'),
    updateTime: extractSection(header, 'Update Time'),
    description: extractSection(header, 'Description'),
    fileReferences: parseListSection(extractSection(header, 'File References')),
    messages,
  };
}

export function detectMimeType(buffer: Buffer, refHint?: string): string {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return 'video/mp4';
  }
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }

  const hint = refHint?.toLowerCase() ?? '';
  if (hint.endsWith('.png')) return 'image/png';
  if (hint.endsWith('.jpg') || hint.endsWith('.jpeg')) return 'image/jpeg';
  if (hint.endsWith('.gif')) return 'image/gif';
  if (hint.endsWith('.webp')) return 'image/webp';
  if (hint.endsWith('.mp4')) return 'video/mp4';
  if (hint.endsWith('.webm')) return 'video/webm';
  if (hint.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
}

export function assetKindFromMime(mimeType: string): ResolvedChatGptAsset['kind'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}

/** Returns the newest chatgpt-import upload directory relative path. */
export async function findLatestChatGptUploadDir(repositoryPath: string): Promise<string | null> {
  const uploadsRoot = path.join(repositoryPath, 'Uploads');
  let entries: string[];
  try {
    entries = await fs.readdir(uploadsRoot);
  } catch {
    return null;
  }

  const importDirs = entries
    .filter((name) => name.startsWith('chatgpt-import-'))
    .sort()
    .reverse();
  if (importDirs.length === 0) return null;
  return `Uploads/${importDirs[0]}`;
}

export async function buildUploadAssetIndex(
  repositoryPath: string,
  uploadRelativeDir: string,
): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const fullDir = path.join(repositoryPath, uploadRelativeDir);
  let files: string[];
  try {
    files = await fs.readdir(fullDir);
  } catch {
    return index;
  }

  for (const fileName of files) {
    const relativePath = `${uploadRelativeDir}/${fileName}`.replace(/\\/g, '/');
    index.set(fileName.toLowerCase(), relativePath);
    const base = fileName.replace(/\.dat$/i, '');
    index.set(base.toLowerCase(), relativePath);
    if (base.startsWith('file_')) {
      index.set(base.slice('file_'.length).toLowerCase(), relativePath);
    }
  }
  return index;
}

export function resolveUploadRef(ref: string, index: Map<string, string>): string | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    trimmed.toLowerCase(),
    `${trimmed}.dat`,
    `${trimmed.toLowerCase()}.dat`,
    trimmed.replace(/^file_/, ''),
    `file_${trimmed}`,
    `file_${trimmed}.dat`,
  ];

  for (const candidate of candidates) {
    const hit = index.get(candidate.toLowerCase());
    if (hit) return hit;
  }

  const base = path.basename(trimmed).toLowerCase();
  for (const [key, value] of index.entries()) {
    if (key.includes(base) || base.includes(key)) return value;
  }

  return null;
}

export async function resolveChatGptAssets(
  repositoryPath: string,
  refs: string[],
): Promise<ResolvedChatGptAsset[]> {
  const uploadDir = await findLatestChatGptUploadDir(repositoryPath);
  if (!uploadDir) return [];

  const index = await buildUploadAssetIndex(repositoryPath, uploadDir);
  const resolved: ResolvedChatGptAsset[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const relativePath = resolveUploadRef(ref, index);
    if (!relativePath || seen.has(relativePath)) continue;
    seen.add(relativePath);

    const fullPath = path.join(repositoryPath, relativePath);
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(fullPath);
    } catch {
      continue;
    }

    const mimeType = detectMimeType(buffer, ref);
    resolved.push({
      ref,
      relativePath,
      fileName: path.basename(relativePath),
      mimeType,
      kind: assetKindFromMime(mimeType),
    });
  }

  return resolved;
}

export async function readRepositoryAssetDataUrl(
  repositoryPath: string,
  relativePath: string,
  refHint?: string,
): Promise<{ dataUrl: string; mimeType: string; sizeBytes: number }> {
  const full = path.join(repositoryPath, relativePath);
  const normalizedRoot = path.resolve(repositoryPath);
  const normalizedFull = path.resolve(full);
  if (!normalizedFull.startsWith(normalizedRoot)) {
    throw new Error('Invalid file path.');
  }

  const buffer = await fs.readFile(full);
  const mimeType = detectMimeType(buffer, refHint ?? path.basename(relativePath));
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
  return { dataUrl, mimeType, sizeBytes: buffer.length };
}

import type {
  ChatGptConversation,
  ChatGptMessage,
  ChatGptMessageNode,
  ExtractedMessage,
  ParsedChatGptConversation,
} from './types.js';

const PASTED_TRANSCRIPT_MIN_LENGTH = 500;
const SKIP_ROLES = new Set(['system']);

/** Returns true if the JSON array looks like a ChatGPT conversations export. */
export function isChatGptExport(conversations: unknown): conversations is ChatGptConversation[] {
  if (!Array.isArray(conversations) || conversations.length === 0) return false;
  const sample = conversations[0];
  return (
    typeof sample === 'object' &&
    sample !== null &&
    'mapping' in sample &&
    typeof (sample as ChatGptConversation).mapping === 'object'
  );
}

/** Parses conversations.json content into structured conversation records. */
export function parseConversationsJson(raw: string): ParsedChatGptConversation[] {
  const data = parseConversationsJsonArray(raw);
  return data.map(parseConversation);
}

/** Parses and validates the conversations.json array structure. */
export function parseConversationsJsonArray(raw: string): ChatGptConversation[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('conversations.json must be a JSON array.');
  }
  if (!isChatGptExport(data)) {
    throw new Error('Unrecognized export format: expected ChatGPT conversations.json structure.');
  }
  return data;
}

export interface ParseConversationsProgress {
  conversationsTotal: number;
  conversationsProcessed: number;
  messagesProcessed: number;
}

/** Parses conversations incrementally with progress callbacks (yields to event loop). */
export async function parseConversationsIncremental(
  conversations: ChatGptConversation[],
  options: {
    signal?: AbortSignal;
    batchSize?: number;
    onProgress?: (progress: ParseConversationsProgress) => void;
  } = {},
): Promise<ParsedChatGptConversation[]> {
  const { signal, batchSize = 25, onProgress } = options;
  const results: ParsedChatGptConversation[] = [];
  let messagesProcessed = 0;

  for (let i = 0; i < conversations.length; i++) {
    if (signal?.aborted) {
      throw new Error('Validation cancelled by user.');
    }

    const parsed = parseConversation(conversations[i]);
    results.push(parsed);
    messagesProcessed += parsed.messages.length;

    if (i % batchSize === 0 || i === conversations.length - 1) {
      onProgress?.({
        conversationsTotal: conversations.length,
        conversationsProcessed: i + 1,
        messagesProcessed,
      });
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  }

  return results;
}

export function parseConversation(conv: ChatGptConversation): ParsedChatGptConversation {
  const conversationId = conv.conversation_id ?? conv.id ?? cryptoRandomId();
  const title = (conv.title?.trim() || 'Untitled Conversation').slice(0, 200);
  const thread = extractActiveThread(conv);
  const messages = thread
    .map((node) => extractMessage(node.message))
    .filter((m): m is ExtractedMessage => m !== null);

  const pastedTranscripts = messages
    .filter((m) => m.isPastedTranscript)
    .map((m) => m.text);

  const fileReferences = [...new Set(messages.flatMap((m) => m.fileReferences))];

  return {
    conversationId,
    title,
    createTime: conv.create_time,
    updateTime: conv.update_time,
    messages,
    pastedTranscripts,
    fileReferences,
    assetPaths: fileReferences,
  };
}

function extractActiveThread(conv: ChatGptConversation): ChatGptMessageNode[] {
  const mapping = conv.mapping ?? {};
  let nodeId: string | null | undefined = conv.current_node;

  if (!nodeId || !mapping[nodeId]) {
    nodeId = findLatestLeaf(mapping);
  }
  if (!nodeId) return [];

  const path: ChatGptMessageNode[] = [];
  const visited = new Set<string>();
  while (nodeId && mapping[nodeId] && !visited.has(nodeId)) {
    visited.add(nodeId);
    path.push(mapping[nodeId]);
    nodeId = mapping[nodeId].parent;
  }
  return path.reverse();
}

function findLatestLeaf(mapping: Record<string, ChatGptMessageNode>): string | undefined {
  let bestId: string | undefined;
  let bestTime = -1;
  for (const node of Object.values(mapping)) {
    if (node.children.length > 0) continue;
    const time = node.message?.create_time ?? 0;
    if (time >= bestTime) {
      bestTime = time;
      bestId = node.id;
    }
  }
  return bestId;
}

function extractMessage(message: ChatGptMessage | null | undefined): ExtractedMessage | null {
  if (!message?.author?.role) return null;
  const role = message.author.role;
  if (SKIP_ROLES.has(role)) return null;

  const text = extractMessageText(message).trim();
  if (!text) return null;

  const fileReferences = extractFileReferences(message, text);

  return {
    role,
    text,
    createTime: message.create_time ?? undefined,
    isPastedTranscript: role === 'user' && text.length >= PASTED_TRANSCRIPT_MIN_LENGTH,
    fileReferences,
  };
}

function extractMessageText(message: ChatGptMessage): string {
  const content = message.content;
  if (!content) return '';

  if (Array.isArray(content.parts)) {
    return content.parts
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const obj = part as Record<string, unknown>;
          if (typeof obj.text === 'string') return obj.text;
          if (typeof obj.content === 'string') return obj.content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof content.text === 'string') return content.text;
  return '';
}

function extractFileReferences(message: ChatGptMessage, text: string): string[] {
  const refs: string[] = [];
  const metadata = message.metadata ?? {};

  const attachments = metadata.attachments;
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att && typeof att === 'object') {
        const obj = att as Record<string, unknown>;
        if (typeof obj.name === 'string') refs.push(obj.name);
        if (typeof obj.id === 'string') refs.push(obj.id);
      }
    }
  }

  const fileRegex = /(?:file-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|dalle-generations\/[^\s"']+|uploaded[^\s"']*\.[a-zA-Z0-9]+)/gi;
  const matches = text.match(fileRegex);
  if (matches) refs.push(...matches);

  return [...new Set(refs)];
}

function cryptoRandomId(): string {
  return `unknown-${Date.now()}`;
}

/** Builds markdown transcript body from extracted messages. */
export function buildTranscriptMarkdown(messages: ExtractedMessage[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    const heading = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : msg.role;
    lines.push(`### ${heading}`);
    if (msg.createTime) {
      lines.push(`*${formatUnixTime(msg.createTime)}*`);
    }
    lines.push('');
    lines.push(msg.text);
    lines.push('');
    if (msg.fileReferences.length > 0) {
      lines.push('**File references:**');
      for (const ref of msg.fileReferences) {
        lines.push(`- ${ref}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n').trim();
}

function formatUnixTime(ts: number): string {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toISOString();
}

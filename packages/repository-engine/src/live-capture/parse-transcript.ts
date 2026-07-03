export interface ParsedTranscriptMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

const ROLE_LINE = /^(user|assistant|system|human|chatgpt|cursor)\s*:\s*(.*)$/i;
const BLOCK_ROLE = /^(user|assistant|system)$/i;

/** Parses pasted ChatGPT/Cursor/plaintext transcripts into message blocks. */
export function parseLiveTranscript(transcript: string): ParsedTranscriptMessage[] {
  const trimmed = transcript.trim();
  if (!trimmed) return [];

  if (/^###\s+(user|assistant)/im.test(trimmed)) {
    const messages: ParsedTranscriptMessage[] = [];
    for (const block of trimmed.split(/^###\s+/im).slice(1)) {
      const lines = block.trim().split('\n');
      const roleRaw = lines[0]?.trim().toLowerCase();
      if (!roleRaw || !BLOCK_ROLE.test(roleRaw)) continue;
      const role = roleRaw === 'user' ? 'user' : roleRaw === 'assistant' ? 'assistant' : 'system';
      messages.push({ role, text: lines.slice(1).join('\n').trim() });
    }
    if (messages.length > 0) return messages;
  }

  const messages: ParsedTranscriptMessage[] = [];
  let current: ParsedTranscriptMessage | null = null;

  for (const line of trimmed.split('\n')) {
    const match = line.match(ROLE_LINE);
    if (match) {
      if (current?.text.trim()) messages.push(current);
      const roleToken = match[1].toLowerCase();
      const role =
        roleToken === 'assistant' || roleToken === 'chatgpt' || roleToken === 'cursor'
          ? 'assistant'
          : roleToken === 'system'
            ? 'system'
            : 'user';
      current = { role, text: match[2] ?? '' };
      continue;
    }
    if (!current) {
      current = { role: 'user', text: line };
    } else {
      current.text += `${current.text ? '\n' : ''}${line}`;
    }
  }
  if (current?.text.trim()) messages.push(current);

  if (messages.length === 0) {
    return [{ role: 'user', text: trimmed }];
  }
  return messages;
}

export function deriveCaptureTitle(
  title: string | undefined,
  messages: ParsedTranscriptMessage[],
  sourceKind: string,
): string {
  if (title?.trim()) return title.trim().slice(0, 120);
  const firstUser = messages.find((message) => message.role === 'user');
  if (firstUser?.text.trim()) return firstUser.text.trim().slice(0, 120);
  return `${sourceKind} session ${new Date().toISOString().slice(0, 10)}`;
}

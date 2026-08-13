/** Valid exact KRC identity: KRC- + exactly four digits. */
const EXACT_KRC_PATTERN = /\bKRC-(\d{4})\b/gi;
const FULL_KRC_PATTERN = /^KRC-(\d{4})$/i;

/** Normalize a single candidate to uppercase KRC-####, or null if invalid. */
export function normalizeKrcId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.trim().match(FULL_KRC_PATTERN);
  if (!match) return null;
  return `KRC-${match[1]}`;
}

/**
 * Deterministic extraction of valid KRC-\d{4} identifiers.
 * Case-insensitive input → uppercase output; deduplicated; full identifier only.
 */
export function extractExactKrcIds(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(EXACT_KRC_PATTERN.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const id = `KRC-${match[1]}`;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/** Extract a KRC id from a repository path or filename when present. */
export function extractKrcIdFromPath(relativePath: string): string | null {
  return extractExactKrcIds(relativePath)[0] ?? null;
}

/** Normalize a list of UI-selected source ids; drops invalid entries. */
export function normalizeSelectedSourceIds(ids: string[] | null | undefined): string[] {
  if (!ids?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = normalizeKrcId(raw) ?? extractExactKrcIds(raw)[0] ?? null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

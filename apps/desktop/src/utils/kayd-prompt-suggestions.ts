/**
 * KayD primary prompt suggestions — max three, no duplicate topic variants.
 */

/** Collapse near-duplicate starters (e.g. multiple ChatGPT Import phrasings) to one key. */
export function suggestionDedupeKey(prompt: string): string {
  const t = prompt.trim().toLowerCase();
  if (!t) return '';
  if (/chatgpt/.test(t) && /import/.test(t)) return 'topic:chatgpt-import';
  if (/repository\s*repair/.test(t)) return 'topic:repository-repair';
  if (/posca/.test(t)) return 'topic:posca';
  return `exact:${t}`;
}

/** Select up to `max` unique starter prompts for the primary KayD conversation area. */
export function selectStarterPrompts(chips: readonly string[], max = 3): string[] {
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const chip of chips) {
    const key = suggestionDedupeKey(chip);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push(chip.trim());
    if (selected.length >= max) break;
  }
  return selected;
}

export const KAYD_PRIMARY_FOLLOW_UP_LIMIT = 3;

/** Cap follow-up capability chips shown beside the active answer. */
export function selectFollowUpChipIndices(total: number, max = KAYD_PRIMARY_FOLLOW_UP_LIMIT): number[] {
  const limit = Math.min(Math.max(0, total), Math.max(0, max));
  return Array.from({ length: limit }, (_, index) => index);
}

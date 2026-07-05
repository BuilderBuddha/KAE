/** Shared helpers — natural Chief-of-Staff briefing without label stacking. */

export function normalizeBriefText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\bKRC-\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): Set<string> {
  return new Set(
    normalizeBriefText(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
}

/** Skip a line when it mostly repeats something already spoken. */
export function substantiallyOverlaps(a: string, b: string): boolean {
  const left = normalizeBriefText(a);
  const right = normalizeBriefText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const aTokens = tokens(left);
  const bTokens = tokens(right);
  if (aTokens.size === 0 || bTokens.size === 0) return false;

  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  const overlap = shared / Math.min(aTokens.size, bTokens.size);
  return overlap >= 0.55;
}

/** Append only when it adds new context to the briefing stream. */
export function pushUniqueLine(lines: string[], line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (lines.some((existing) => substantiallyOverlaps(existing, trimmed))) return;
  lines.push(trimmed);
}

/** Turn bullet tasks into a spoken attention line. */
export function formatAttentionBrief(bullets: string): string {
  const items = bullets
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

  if (items.length === 0) return '';
  if (items.length === 1) return `One thing needs your call — ${items[0]}.`;
  return `A few things need your call:\n${items.map((item) => `• ${item}`).join('\n')}`;
}

/** Natural closing invitation — varies slightly so it does not feel templated. */
export function executiveSessionInvite(variant: 'home' | 'workspace' = 'home'): string {
  return variant === 'home'
    ? 'What would you like to tackle first?'
    : 'Tell me where you want to go next.';
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'had',
  'her',
  'was',
  'one',
  'our',
  'out',
  'has',
  'have',
  'been',
  'from',
  'with',
  'this',
  'that',
  'they',
  'will',
  'your',
  'what',
  'when',
  'how',
  'who',
  'why',
  'which',
]);

/** Tokenizes text into normalized search terms for the evidence index. */
export function tokenizeSearchTerms(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  return [...new Set(tokens)];
}

/** Tokenizes a user query; preserves KRC identifiers as a single token. */
export function tokenizeQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (/^krc-\d{4}$/i.test(trimmed)) {
    return [trimmed.toLowerCase()];
  }

  const phrase = trimmed.toLowerCase();
  const tokens = tokenizeSearchTerms(trimmed);
  if (tokens.length === 0 && phrase.length > 0) {
    return [phrase];
  }
  return tokens;
}

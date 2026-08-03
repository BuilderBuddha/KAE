import type { VigsyQuestionIntent } from '@scooper/core';

const DECISION_PATTERNS = [
  /\bwhat did we decide\b/i,
  /\bwhat was decided\b/i,
  /\bour decision\b/i,
  /\bdecide about\b/i,
];

const SUMMARIZE_PATTERNS = [/\bsummarize\b/i, /\bsummary of\b/i, /\bgive me an overview\b/i];

const SHOW_EVIDENCE_PATTERNS = [
  /\bshow evidence\b/i,
  /\bprove that\b/i,
  /\bevidence that\b/i,
  /\bdemonstrate\b/i,
];

const BLOCKER_PATTERNS = [
  /\bblockers?\b/i,
  /\bunresolved\b/i,
  /\bremaining\b/i,
  /\bissues?\b/i,
  /\brisks?\b/i,
  /\btodo\b/i,
  /\bopen problems?\b/i,
];

const QUESTION_PREFIXES = [
  /^what did we decide about\s+/i,
  /^what happened with\s+/i,
  /^what are the\s+/i,
  /^what is the\s+/i,
  /^summarize\s+/i,
  /^show evidence that\s+/i,
  /^show me evidence (?:that|for)\s+/i,
  /^tell me about\s+/i,
  /^how did\s+/i,
  /^why did\s+/i,
  /\?+$/g,
];

/** Classifies question intent for retrieval ranking and answer composition. */
export function classifyQuestionIntent(question: string): VigsyQuestionIntent {
  const q = question.trim();
  if (DECISION_PATTERNS.some((pattern) => pattern.test(q))) return 'decision';
  if (SUMMARIZE_PATTERNS.some((pattern) => pattern.test(q))) return 'summarize';
  if (SHOW_EVIDENCE_PATTERNS.some((pattern) => pattern.test(q))) return 'show_evidence';
  if (BLOCKER_PATTERNS.some((pattern) => pattern.test(q))) return 'blockers';
  return 'general';
}

/** Extracts a search query from a natural-language question. */
export function extractSearchQuery(question: string): string {
  let query = question.trim();

  const followUp = query.match(/\(following up on:\s*([^)]+)\)/i)?.[1]?.trim();
  if (followUp) return followUp;

  const whyQuoted = query.match(/^why does\s+"([^"]+)"\s+matter\??$/i)?.[1]?.trim();
  if (whyQuoted) return whyQuoted;

  const aboutTopic = query.match(
    /^(?:why does|what should we do next about|tell me more about|summarize more about)\s+(.+?)\??$/i,
  )?.[1]?.trim();
  if (aboutTopic && !/^(that|this|it)$/i.test(aboutTopic)) {
    return aboutTopic.replace(/^["']|["']$/g, '').trim();
  }

  for (const prefix of QUESTION_PREFIXES) {
    query = query.replace(prefix, '');
  }
  query = query.replace(/\b(in kae|for kae)\b/gi, '').trim();
  return query || question.trim();
}

const DECISION_TERMS = ['decided', 'decision', 'agreed', 'conclusion', 'resolved', 'plan'];
const BLOCKER_TERMS = [
  'blocker',
  'unresolved',
  'remaining',
  'issue',
  'risk',
  'todo',
  'pending',
  'failed',
  'missing',
];

export function recordMatchesBlockerTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKER_TERMS.some((term) => lower.includes(term));
}

export function recordMatchesDecisionTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return DECISION_TERMS.some((term) => lower.includes(term));
}

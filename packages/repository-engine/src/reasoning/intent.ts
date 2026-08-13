import type { VigsyQuestionIntent } from '@scooper/core';
import { isExecutiveBriefRequest } from '../tasks/executive-brief-request.js';
import { extractExactKrcIds } from './krc-ids.js';

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

/** Navigation / source-identity requests — not ordinary knowledge questions. */
const SOURCE_LOOKUP_PATTERNS = [
  /\bshow(?:\s+me)?\s+source\b/i,
  /\bopen\s+source\b/i,
  /\bfind\s+(?:source\s+)?krc-\d{4}\b/i,
  /\bshow(?:\s+me)?\s+krc-\d{4}\b/i,
  /\bwhere\s+is\s+krc-\d{4}\b/i,
  /\blocate\s+(?:source\s+)?krc-\d{4}\b/i,
  /\bopen\s+krc-\d{4}\b/i,
  /\bsource\s+krc-\d{4}\b/i,
  /^krc-\d{4}\s*$/i,
];

/** Checkpoint F0a — relationship-trace questions (governed index only). */
const RELATIONSHIP_TRACE_PATTERNS = [
  /\brelationship\s+between\b/i,
  /\btrace\s+(?:the\s+)?(?:relationship|link|connection|connections)\b/i,
  /\bhow\s+(?:is|are|does|do)\b.+\b(?:related|connected|linked)\b/i,
  /\bwhat\s+(?:connects|links)\b/i,
  /\bconnected\s+to\b/i,
  /\blinked\s+to\b/i,
  /\brelated\s+(?:sources?|evidence|sessions?|conversations?)\b/i,
  /\bshow\s+(?:me\s+)?(?:the\s+)?(?:links|connections|relationships)\b/i,
];

/** Checkpoint F0a — project/topic lookup (governed metadata / relationships only). */
const PROJECT_TOPIC_PATTERNS = [
  /\brelated\s+projects?\b/i,
  /\brelated\s+topics?\b/i,
  /\brelated\s+campaigns?\b/i,
  /\bwhich\s+projects?\b/i,
  /\bwhat\s+projects?\b/i,
  /\bwhich\s+topics?\b/i,
  /\bwhat\s+topics?\b/i,
  /\bwhich\s+campaigns?\b/i,
  /\bwhat\s+campaigns?\b/i,
  /\bprojects?\s+(?:related|connected|linked)\s+to\b/i,
  /\btopics?\s+(?:related|connected|linked)\s+to\b/i,
  /\bcampaigns?\s+(?:related|connected|linked)\s+to\b/i,
  /\bprojects?\s+(?:for|about)\b/i,
  /\btopics?\s+(?:for|about)\b/i,
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
  if (isExecutiveBriefRequest(q)) return 'executive_brief';
  if (SOURCE_LOOKUP_PATTERNS.some((pattern) => pattern.test(q))) return 'source_lookup';
  if (RELATIONSHIP_TRACE_PATTERNS.some((pattern) => pattern.test(q))) return 'relationship_trace';
  if (PROJECT_TOPIC_PATTERNS.some((pattern) => pattern.test(q))) return 'project_topic';
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

  // Source-lookup / exact identity: prefer bare KRC when present.
  const intent = classifyQuestionIntent(query);
  const krcs = extractExactKrcIds(query);
  if (intent === 'source_lookup' && krcs.length === 1) {
    return krcs[0];
  }
  if (intent === 'source_lookup' && krcs.length > 1) {
    return krcs.join(' ');
  }

  for (const prefix of QUESTION_PREFIXES) {
    query = query.replace(prefix, '');
  }
  query = query.replace(/\b(in kae|for kae)\b/gi, '').trim();

  // Strip common project/relationship framing so search focuses on the topic/anchor.
  if (intent === 'project_topic' || intent === 'relationship_trace') {
    query = query
      .replace(
        /\b(?:related|which|what)\s+(?:projects?|topics?|campaigns?|sources?|evidence|sessions?|conversations?|links|connections|relationships)\b/gi,
        ' ',
      )
      .replace(/\b(?:projects?|topics?|campaigns?)\s+(?:related|connected|linked)\s+to\b/gi, ' ')
      .replace(/\brelationship\s+between\b/gi, ' ')
      .replace(/\btrace\s+(?:the\s+)?(?:relationship|link|connection|connections)\b/gi, ' ')
      .replace(/\b(?:connected|linked)\s+to\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

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

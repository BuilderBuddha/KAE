import type { ExecutiveBriefing } from '@scooper/core';
import type { VigsySessionContext } from './vigsy-context';

export interface ActiveInvestigation {
  topic: string;
  searchQuery: string;
}

export type InvestigationView =
  | 'timeline'
  | 'sources'
  | 'images'
  | 'videos'
  | 'related'
  | 'conversation'
  | 'repository'
  | 'confidence'
  | 'why'
  | 'summarize';

const VIEW_QUESTION_PATTERNS =
  /^(walk me through the timeline for\s+"|show me the supporting sources for\s+"|show me the images related to\s+"|show me the videos related to\s+"|what related knowledge connects to\s+"|continue the open conversation for\s+"|show me repository evidence for\s+"|explain the confidence level for\s+"|why does\s+"[^"]+"\s+matter|summarize more about\s+")/i;

/** True when the question is an explicit capability-chip style prompt (quoted topic). */
export function isInvestigationCapabilityQuestion(question: string): boolean {
  return VIEW_QUESTION_PATTERNS.test(question.trim());
}

const VIEW_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^walk me through the timeline for\s+"/i, label: 'Timeline' },
  { pattern: /^show me the supporting sources for\s+"/i, label: 'Sources' },
  { pattern: /^show me the images related to\s+"/i, label: 'Images' },
  { pattern: /^show me the videos related to\s+"/i, label: 'Videos' },
  { pattern: /^what related knowledge connects to\s+"/i, label: 'Related Knowledge' },
  { pattern: /^continue the open conversation for\s+"/i, label: 'Open Conversation' },
  { pattern: /^show me repository evidence for\s+"/i, label: 'Repository' },
  { pattern: /^explain the confidence level for\s+"/i, label: 'Confidence' },
  { pattern: /^why does\s+"[^"]+"\s+matter/i, label: 'Why' },
  { pattern: /^summarize more about\s+"/i, label: 'Summary' },
];

/** Human-readable capability lens for the active investigation thread. */
export function investigationViewLabel(question: string): string | null {
  const q = question.trim();
  for (const entry of VIEW_LABELS) {
    if (entry.pattern.test(q)) return entry.label;
  }
  return null;
}

/** Resolve capability view from a follow-up question. */
export function investigationViewFromQuestion(question: string): InvestigationView | null {
  const label = investigationViewLabel(question);
  return label ? investigationViewFromLens(label) : null;
}

const FOLLOW_UP_MARKERS = /\(following up on:/i;

/** Strip follow-up enrichment so the investigation topic stays stable across capability lenses. */
export function extractInvestigationTopic(text: string): string {
  const trimmed = text.trim();
  const followUp = trimmed.match(/\(following up on:\s*([^)]+)\)/i)?.[1]?.trim();
  if (followUp) return followUp;
  const whyQuoted = trimmed.match(/^why does\s+"([^"]+)"\s+matter\??$/i)?.[1]?.trim();
  if (whyQuoted) return whyQuoted;
  const aboutQuoted = trimmed.match(
    /^(?:summarize more about|tell me more about|what should we do next about)\s+(.+?)\??$/i,
  )?.[1]?.trim();
  if (aboutQuoted) {
    return aboutQuoted.replace(/^["']|["']$/g, '').trim();
  }
  const quoted = trimmed.match(/for ["']([^"']+)["']/i)?.[1]?.trim();
  if (quoted) return quoted;
  const related = trimmed.match(/connects to ["']([^"']+)["']/i)?.[1]?.trim();
  if (related) return related;
  const relatedTo = trimmed.match(/related to ["']([^"']+)["']/i)?.[1]?.trim();
  if (relatedTo) return relatedTo;
  return trimmed;
}

/** Map display lens label to investigation view id. */
export function investigationViewFromLens(lens: string | null): InvestigationView | null {
  if (!lens) return null;
  const map: Record<string, InvestigationView> = {
    Timeline: 'timeline',
    Sources: 'sources',
    Images: 'images',
    Videos: 'videos',
    'Related Knowledge': 'related',
    'Open Conversation': 'conversation',
    Repository: 'repository',
    Confidence: 'confidence',
    Why: 'why',
    Summary: 'summarize',
  };
  return map[lens] ?? null;
}

/** Screen-native capability role during an investigation. */
export function investigationCapabilityRole(screen: string): string {
  switch (screen) {
    case 'search':
      return 'Sources & evidence index';
    case 'explorer':
      return 'Repository files';
    case 'import':
    case 'connectors':
      return 'Knowledge sources';
    case 'dashboard':
      return 'Health & repair';
    case 'vigsy':
      return 'Executive conversation';
    default:
      return 'Supporting capability';
  }
}

/** Maps a supporting capability to a conversation continuation prompt. */
export function investigationViewQuestion(view: InvestigationView, searchQuery: string): string {
  const q = searchQuery.trim();
  switch (view) {
    case 'timeline':
      return `Walk me through the timeline for "${q}".`;
    case 'sources':
      return `Show me the supporting sources for "${q}".`;
    case 'images':
      return `Show me the images related to "${q}".`;
    case 'videos':
      return `Show me the videos related to "${q}".`;
    case 'related':
      return `What related knowledge connects to "${q}"?`;
    case 'conversation':
      return `Continue the open conversation for "${q}".`;
    case 'repository':
      return `Show me repository evidence for "${q}".`;
    case 'confidence':
      return `Explain the confidence level for "${q}" and what supports it.`;
    case 'why':
      return `Why does "${q}" matter?`;
    case 'summarize':
      return `Summarize more about "${q}".`;
  }
}

export function topicsOverlap(a: string, b: string): boolean {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const leftWords = left.split(/\s+/).filter((word) => word.length > 3);
  return leftWords.some((word) => right.includes(word));
}

/** True when the user is starting a fresh investigation topic. */
export function isNewInvestigationQuestion(question: string, session: VigsySessionContext): boolean {
  const q = question.trim();
  if (!q || !session.lastSearchQuery) return false;
  if (FOLLOW_UP_MARKERS.test(q)) return false;
  if (VIEW_QUESTION_PATTERNS.test(q)) return false;
  if (/^why\??$/i.test(q)) return false;
  if (/^(why does that matter|why does this matter|why does it matter|what should we do next)\??$/i.test(q)) {
    return false;
  }
  if (topicsOverlap(q, session.lastSearchQuery)) return false;
  if (topicsOverlap(q, session.lastQuestion ?? '')) return false;
  return q.split(/\s+/).length >= 3;
}

export function investigationFromSession(session: VigsySessionContext): ActiveInvestigation | null {
  if (!session.lastSearchQuery) return null;
  return {
    topic: session.lastQuestion ?? session.lastSearchQuery,
    searchQuery: session.lastSearchQuery,
  };
}

export function investigationWorkspaceHandoff(
  screen: string,
  investigation: ActiveInvestigation,
): string[] {
  const topic = investigation.searchQuery;
  switch (screen) {
    case 'explorer':
      return [`Still on "${topic}" — browse repository evidence below and keep asking me in the chat.`];
    case 'search':
      return [`Still investigating "${topic}" — search below stays tied to this thread.`];
    case 'import':
      return [`Investigation "${topic}" is still active — connect sources below without losing this thread.`];
    case 'dashboard':
      return [`Still on "${topic}" — dashboard details below support the same investigation.`];
    default:
      return [`Continuing "${topic}" — ask me anything in the chat.`];
  }
}

/** Alive section lines — how this workspace relates to the active investigation. */
export function buildInvestigationSectionLines(
  screen: string,
  investigation: ActiveInvestigation,
): string[] {
  const topic = investigation.searchQuery;
  switch (screen) {
    case 'search':
      return [
        `Search is scoped to "${topic}".`,
        'Results below refresh as we talk — ask me to interpret what matters.',
      ];
    case 'explorer':
      return [
        `Repository view for "${topic}".`,
        'Pick a file below or ask me what changed in this area.',
      ];
    case 'import':
      return [
        `Knowledge sources for "${topic}".`,
        'Connect or sync below if we need fresher evidence for this thread.',
      ];
    case 'dashboard':
      return [
        `Dashboard context for "${topic}".`,
        'Health and repair below — ask me which issues block this investigation.',
      ];
    default:
      return [`This view supports your work on "${topic}".`];
  }
}

export function buildSectionAwarenessBriefing(
  briefing: ExecutiveBriefing | null | undefined,
  investigation: ActiveInvestigation | null | undefined,
): string[] {
  const filtered = filterExecutiveBriefingForInvestigation(briefing, investigation?.searchQuery);
  if (!filtered?.cards.length) return [];
  return filtered.cards.map((card) => {
    const summary = card.summary.trim();
    const why = card.whyItMatters.trim();
    return summary
      ? `${card.title} — ${summary} Why it matters: ${why}`
      : `${card.title}. Why it matters: ${why}`;
  });
}

/** Narrow supporting awareness to the active investigation topic when one is in flight. */
export function filterExecutiveBriefingForInvestigation(
  briefing: ExecutiveBriefing | null | undefined,
  searchQuery?: string,
): ExecutiveBriefing | null {
  if (!briefing) return null;
  let cards = briefing.cards.filter((card) => !card.isPlaceholder);
  const topic = searchQuery?.trim();
  if (topic) {
    const matched = cards.filter(
      (card) =>
        topicsOverlap(card.title, topic) ||
        topicsOverlap(card.summary, topic) ||
        card.evidenceLinks.some((link) => topicsOverlap(link.label, topic)),
    );
    if (matched.length > 0) cards = matched;
  }
  return { ...briefing, cards };
}

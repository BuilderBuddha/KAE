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
  /^(walk me through the timeline|show me the supporting sources|show me the images|show me the videos|what related knowledge|continue the open conversation|show me repository evidence|explain the confidence|why does|summarize more about)/i;

const FOLLOW_UP_MARKERS = /\(following up on:/i;

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

function topicsOverlap(a: string, b: string): boolean {
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

/** Conversational awareness lines — no static placecards. */
export function buildSectionAwarenessBriefing(
  briefing: ExecutiveBriefing | null | undefined,
  investigation: ActiveInvestigation | null | undefined,
): string[] {
  if (!briefing?.cards.length) return [];
  const topic = investigation?.searchQuery?.toLowerCase();
  let cards = briefing.cards.filter((card) => !card.isPlaceholder);
  if (topic) {
    const matched = cards.filter(
      (card) =>
        topicsOverlap(card.title, topic) ||
        topicsOverlap(card.summary, topic) ||
        card.evidenceLinks.some((link) => topicsOverlap(link.label, topic)),
    );
    if (matched.length > 0) cards = matched;
  }
  if (cards.length === 0) return [];
  return cards.map((card) => {
    const summary = card.summary.trim();
    const why = card.whyItMatters.trim();
    return summary
      ? `${card.title} — ${summary} Why it matters: ${why}`
      : `${card.title}. Why it matters: ${why}`;
  });
}

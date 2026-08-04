/**
 * Phase 3.1 presentation helpers — governed Executive Brief task response.
 * Does not change prepare/revise/approve/write contracts.
 */

export const EXECUTIVE_BRIEF_PREPARED_TRANSITION =
  'I prepared the Executive Brief for your review.';

export const EXECUTIVE_BRIEF_REVISED_TRANSITION =
  'I revised the Executive Brief for your review.';

export const EXECUTIVE_BRIEF_ALREADY_READY_MESSAGE =
  'An Executive Brief is already ready for review. Approve it, request a revision, or cancel it before creating another.';

/** Discoverable suggested action — submits through the shared KayD conversation path. */
export const EXECUTIVE_BRIEF_SUGGESTED_ACTION_LABEL = 'Prepare Executive Brief';

/** Canonical question for the suggested action — same runtime as typed NL. */
export const EXECUTIVE_BRIEF_SUGGESTED_ACTION_QUESTION =
  'Prepare an executive brief from this investigation.';

export const EXECUTIVE_BRIEF_NEEDS_EVIDENCE_MESSAGE =
  'I need an evidence-backed investigation before I can prepare the Executive Brief.';

export const EXECUTIVE_BRIEF_NEEDS_EVIDENCE_NEXT_STEP =
  'Ask what happened with a topic in your repository, then request the Executive Brief again.';

export function executiveBriefTransitionMessage(kind: 'prepare' | 'revise'): string {
  return kind === 'revise'
    ? EXECUTIVE_BRIEF_REVISED_TRANSITION
    : EXECUTIVE_BRIEF_PREPARED_TRANSITION;
}

export function executiveBriefNeedsEvidenceText(): string {
  return `${EXECUTIVE_BRIEF_NEEDS_EVIDENCE_MESSAGE} ${EXECUTIVE_BRIEF_NEEDS_EVIDENCE_NEXT_STEP}`;
}

export function isExecutiveBriefTransitionText(text: string | undefined | null): boolean {
  const t = (text ?? '').trim();
  return (
    t === EXECUTIVE_BRIEF_PREPARED_TRANSITION ||
    t === EXECUTIVE_BRIEF_REVISED_TRANSITION ||
    t === EXECUTIVE_BRIEF_ALREADY_READY_MESSAGE
  );
}

/** True when this turn should show one concise transition + governed preview (not a full KayD answer). */
export function shouldUseExecutiveBriefTaskResponse(input: {
  revising: boolean;
  intent?: string;
  questionIsBriefRequest: boolean;
  /** Revise phrasing with an active preview — not after cancel. */
  reviseWithActivePreview?: boolean;
}): boolean {
  return (
    input.revising ||
    Boolean(input.reviseWithActivePreview) ||
    input.intent === 'executive_brief' ||
    input.questionIsBriefRequest
  );
}

/** Active governed preview — cancelled/saved/failed are not actionable. */
export function isActiveExecutiveBriefTask(state: string | undefined | null): boolean {
  return state === 'preview-ready' || state === 'revision-requested';
}

/** Show the discoverable prepare action when investigation evidence exists and no preview is active. */
export function shouldShowPrepareExecutiveBriefAction(input: {
  hasInvestigationEvidence: boolean;
  previewActive: boolean;
}): boolean {
  return input.hasInvestigationEvidence && !input.previewActive;
}

export type ConversationTurnLike = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  answer?: unknown;
  thinking?: boolean;
  streaming?: boolean;
  error?: string;
};

/**
 * When the latest assistant turn is a governed brief transition, keep the prior
 * grounded user+assistant exchange visible. Ordinary follow-ups stay latest-only.
 */
export function selectConversationFlowTurns(turns: ConversationTurnLike[]): ConversationTurnLike[] {
  if (turns.length === 0) return [];

  let latestAssistantIndex = -1;
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index]?.role === 'assistant') {
      latestAssistantIndex = index;
      break;
    }
  }
  if (latestAssistantIndex < 0) return turns.slice(-1);

  const latestAssistant = turns[latestAssistantIndex]!;
  const taskUser =
    latestAssistantIndex > 0 && turns[latestAssistantIndex - 1]?.role === 'user'
      ? turns[latestAssistantIndex - 1]!
      : null;

  if (!isExecutiveBriefTransitionText(latestAssistant.text) || latestAssistant.answer) {
    // Ordinary single-pane: latest assistant only (Phase 1 progressive answer).
    return [latestAssistant];
  }

  // Walk back past the task user turn to the prior grounded assistant answer.
  let cursor = taskUser ? latestAssistantIndex - 2 : latestAssistantIndex - 1;
  while (cursor >= 0) {
    const candidate = turns[cursor]!;
    if (
      candidate.role === 'assistant' &&
      candidate.answer &&
      !isExecutiveBriefTransitionText(candidate.text)
    ) {
      const groundedUser =
        cursor > 0 && turns[cursor - 1]?.role === 'user' ? turns[cursor - 1]! : null;
      return [groundedUser, candidate, taskUser, latestAssistant].filter(
        (turn): turn is ConversationTurnLike => Boolean(turn),
      );
    }
    cursor -= 1;
  }

  return [taskUser, latestAssistant].filter((turn): turn is ConversationTurnLike => Boolean(turn));
}

/**
 * Natural-language detection for governed Executive Brief requests.
 * Shared by intent classification and the KayD task response gate.
 *
 * Matches bounded task asks (brief / briefing / brief me / turn into …).
 * Does not match unrelated brevity (“keep it brief”, “brief answer”).
 */

function isUnrelatedBrevityRequest(q: string): boolean {
  if (/\bkeep\s+(it|this|the\s+answer)\s+brief\b/i.test(q)) return true;
  if (/\bbrief\s+answer\b/i.test(q)) return true;
  if (/\b(in|be)\s+brief\b/i.test(q) && !/\bexecutive\b/i.test(q) && !/\binvestigation\b/i.test(q)) {
    return true;
  }
  if (/^(be\s+)?brief[.!?]?$/i.test(q)) return true;
  return false;
}

function mentionsExecutiveBriefArtifact(q: string): boolean {
  return /\bexecutive\s+brief(?:ing)?s?\b/i.test(q);
}

/** Pure revise phrasing — only valid when an active preview exists. */
export function isExecutiveBriefReviseRequest(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  if (!mentionsExecutiveBriefArtifact(q)) return false;
  if (!/\brevise\b/i.test(q)) return false;
  // Prepare/create language wins as a new task request, not revise-only.
  if (/\b(prepare|create|make|write|give|turn)\b/i.test(q)) return false;
  return true;
}

/**
 * True when the user is requesting a new governed Executive Brief (prepare/create path).
 */
export function isExecutiveBriefRequest(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  if (isUnrelatedBrevityRequest(q)) return false;
  if (isExecutiveBriefReviseRequest(q)) return false;

  if (mentionsExecutiveBriefArtifact(q)) return true;

  // “Brief me on this investigation / this evidence”
  if (
    /\bbrief\s+me\b/i.test(q) &&
    /\b(this\s+investigation|this\s+evidence|the\s+investigation|the\s+evidence)\b/i.test(q)
  ) {
    return true;
  }

  // “Turn this investigation into an executive brief/briefing”
  if (/\bturn\s+this\b/i.test(q) && /\binto\b/i.test(q) && /\bbrief(?:ing)?\b/i.test(q)) {
    return true;
  }

  // prepare/create/make/write/give + brief(ing) scoped to investigation/evidence/this
  if (
    /\b(prepare|create|make|write|give)\b/i.test(q) &&
    /\bbrief(?:ing)?\b/i.test(q) &&
    /\b(investigation|evidence|this)\b/i.test(q)
  ) {
    return true;
  }

  return false;
}

/** Active governed preview — cancelled/saved/failed are not actionable. */
export function isActiveExecutiveBriefTask(state: string | undefined | null): boolean {
  return state === 'preview-ready' || state === 'revision-requested';
}

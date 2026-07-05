import type { AssembledEvidenceContext, VigsyConfidence } from '@scooper/core';

function gist(text: string, max = 220): string {
  const normalized = text
    .trim()
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\bKRC-\d+\b/gi, '')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (normalized.length <= max) return normalized;
  const sentence = normalized.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
  if (sentence && sentence.length <= max) return sentence;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function sanitizeGist(text: string): string {
  return text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\bKRC-\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): Set<string> {
  return new Set(
    sanitizeGist(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
}

function substantiallyOverlaps(a: string, b: string): boolean {
  const left = sanitizeGist(a);
  const right = sanitizeGist(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const aTokens = tokens(left);
  const bTokens = tokens(right);
  if (aTokens.size === 0 || bTokens.size === 0) return false;
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared / Math.min(aTokens.size, bTokens.size) >= 0.55;
}

function pushUnique(parts: string[], line: string): void {
  const trimmed = sanitizeGist(line);
  if (!trimmed) return;
  if (parts.some((existing) => substantiallyOverlaps(existing, trimmed))) return;
  parts.push(trimmed);
}

function leadItem(context: AssembledEvidenceContext) {
  return context.items[0];
}

function whereWeAre(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  const topic = context.searchQuery;
  if (confidence.level === 'insufficient') {
    return `We're early on "${topic}" — give me a bit more context and I'll tighten the brief.`;
  }
  if (context.executiveSessions.length > 0) {
    const session = context.executiveSessions[0];
    const title = session.conversationTitle ?? session.title;
    return `We're on "${topic}", tied to your work on ${title}.`;
  }
  return `We're on "${topic}" — I'll keep this about progress, decisions, and the next move.`;
}

function lastSession(context: AssembledEvidenceContext): string | null {
  const session = context.executiveSessions[0];
  if (!session) return null;
  const title = session.conversationTitle ?? session.title;
  const detail = gist(session.excerpt, 180);
  if (!detail) return `Last session we were on ${title}.`;
  return `Last session we were on ${title} — ${detail}`;
}

function whatChanged(context: AssembledEvidenceContext, confidence: VigsyConfidence): string | null {
  if (confidence.level === 'insufficient' || context.items.length === 0) {
    return 'Not much has moved on this thread since we last looked.';
  }

  const lead = leadItem(context)!;
  const detail = gist(lead.excerpt, 220);

  switch (context.intent) {
    case 'decision': {
      const session = context.executiveSessions[0];
      if (session) return gist(session.excerpt, 220);
      break;
    }
    case 'summarize': {
      const throughLine = gist(
        context.items
          .slice(0, 3)
          .map((item) => item.excerpt)
          .join(' '),
        240,
      );
      return throughLine || null;
    }
    case 'blockers': {
      const blockerHits = context.items.filter((item) =>
        /blocker|unresolved|remaining|issue|risk|todo|pending|missing/i.test(item.excerpt),
      );
      if (blockerHits.length > 0) {
        return gist(blockerHits[0].excerpt, 180);
      }
      break;
    }
    default:
      break;
  }

  return detail || null;
}

function whatNeedsAttention(context: AssembledEvidenceContext): string[] {
  const tasks: string[] = [];

  const blockerHits = context.items.filter((item) =>
    /blocker|unresolved|remaining|issue|risk|todo|pending|missing|attention|repair/i.test(item.excerpt),
  );
  for (const hit of blockerHits.slice(0, 3)) {
    const line = gist(hit.excerpt, 120);
    if (line && !tasks.some((task) => substantiallyOverlaps(task, line))) tasks.push(line);
  }

  if (context.intent === 'blockers' && tasks.length === 0) {
    tasks.push('Confirm whether anything still blocks the next executive move.');
  }

  return tasks;
}

function recommendNext(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  if (confidence.level === 'insufficient') {
    return 'Name the outcome you care about and I will re-ground this brief.';
  }

  const session = context.executiveSessions[0];
  const lead = leadItem(context);

  if (context.intent === 'blockers') {
    return lead
      ? 'Decide if this stays on your tracker, assign an owner, and set the next checkpoint.'
      : 'Clarify which campaign this affects so we can pick the next move.';
  }

  if (context.intent === 'decision' && session) {
    return `Close the loop on ${session.conversationTitle ?? session.title} — confirm the decision and what follows.`;
  }

  if (session) {
    return `Pick up ${session.conversationTitle ?? session.title} and choose the next action.`;
  }

  if (lead) {
    return `Skim the strongest thread on "${context.searchQuery}", then tell me the outcome you want to steer toward.`;
  }

  return `Tell me the outcome you want on "${context.searchQuery}" and I'll keep us pointed there.`;
}

function formatAttention(tasks: string[]): string | null {
  if (tasks.length === 0) return null;
  if (tasks.length === 1) return `One thing needs your call — ${tasks[0]}.`;
  return `A few things need your call:\n${tasks.map((task) => `• ${task}`).join('\n')}`;
}

/** Chief-of-staff investigation brief — one cohesive narrative, no label stacking. */
export function buildSteeringDirectAnswer(
  context: AssembledEvidenceContext,
  confidence: VigsyConfidence,
): string {
  const parts: string[] = [];

  pushUnique(parts, whereWeAre(context, confidence));

  const last = lastSession(context);
  if (last) pushUnique(parts, last);

  const changed = whatChanged(context, confidence);
  if (changed) {
    const line = changed.match(/^(since|last|not much)/i) ? changed : `Since then, ${changed}`;
    pushUnique(parts, line);
  }

  const attention = formatAttention(whatNeedsAttention(context));
  if (attention) pushUnique(parts, attention);

  pushUnique(parts, `I'd move next on this: ${recommendNext(context, confidence)}`);

  return parts.join('\n\n');
}

/** Supporting awareness backs the brief — brief, not a file listing. */
export function buildSteeringSupportingSummary(
  context: AssembledEvidenceContext,
  confidence: VigsyConfidence,
): string {
  if (context.items.length === 0) {
    return 'I can widen the search if you want more backup on this thread.';
  }

  const confidenceNote =
    confidence.level === 'high'
      ? "I'm confident in this read"
      : confidence.level === 'medium'
        ? 'This read is moderate confidence'
        : confidence.level === 'low'
          ? 'Treat this as a lower-confidence read'
          : 'Treat this as an early read';

  const threadCount = context.items.length;
  const sessionNote =
    context.executiveSessions.length > 0
      ? ` — ${context.executiveSessions.length} prior session(s) align.`
      : '';

  return `${confidenceNote} across ${threadCount} corroborating thread(s)${sessionNote} Use the lenses below for sources, timeline, or files.`;
}

export function isSteeringFormattedAnswer(text: string): boolean {
  return /i'd move next on this/i.test(text);
}

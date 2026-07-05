import type { AssembledEvidenceContext, VigsyConfidence } from '@scooper/core';

function gist(text: string, max = 220): string {
  const normalized = text
    .trim()
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (normalized.length <= max) return normalized;
  const sentence = normalized.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
  if (sentence && sentence.length <= max) return sentence;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function leadItem(context: AssembledEvidenceContext) {
  return context.items[0];
}

function whatChanged(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  if (confidence.level === 'insufficient' || context.items.length === 0) {
    return `I found limited grounded evidence for "${context.searchQuery}".`;
  }

  const lead = leadItem(context)!;

  switch (context.intent) {
    case 'decision': {
      const session = context.executiveSessions[0];
      if (session) {
        return `Executive session "${session.title}" records a decision tied to your question — ${gist(session.excerpt)}`;
      }
      const assistant = context.messages.find((item) =>
        item.messageRole?.toLowerCase().includes('assistant'),
      );
      if (assistant) {
        return `The strongest decision signal is in "${assistant.title}" — ${gist(assistant.excerpt)}`;
      }
      break;
    }
    case 'summarize': {
      const krcList = context.topKrcIds.slice(0, 3).join(', ') || 'indexed sources';
      return `Across ${context.items.length} retrieved record(s) (${krcList}), the through-line is — ${gist(
        context.items
          .slice(0, 3)
          .map((item) => item.excerpt)
          .join(' '),
        280,
      )}`;
    }
    case 'show_evidence': {
      const att = context.attachments[0];
      if (att) {
        return `Attachment "${att.title}" surfaced as the primary evidence — ${gist(att.excerpt)}`;
      }
      return `Primary evidence is in "${lead.title}" — ${gist(lead.excerpt)}`;
    }
    case 'blockers': {
      const blockerHits = context.items.filter((item) =>
        /blocker|unresolved|remaining|issue|risk|todo|pending|missing/i.test(item.excerpt),
      );
      if (blockerHits.length === 0) {
        return `No explicit blocker language appeared for "${context.searchQuery}" — closest matches may be incomplete.`;
      }
      return `${blockerHits.length} blocker-related hit(s); lead item "${blockerHits[0].title}" — ${gist(blockerHits[0].excerpt)}`;
    }
    default:
      break;
  }

  const corroboration =
    context.topKrcIds.length > 1
      ? ` with ${context.topKrcIds.length} corroborating sources`
      : '';
  return `"${lead.title}" is the lead finding${corroboration} — ${gist(lead.excerpt)}`;
}

function whyItMatters(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  if (confidence.level === 'insufficient') {
    return 'Without grounded sources, the team risks acting on assumptions instead of agreed facts.';
  }

  if (context.executiveSessions.length > 0) {
    return 'Executive sessions anchor what was agreed and what follow-up work should respect.';
  }

  switch (context.intent) {
    case 'decision':
      return 'Recent decisions define what the team committed to and what KayD can ground follow-up answers on.';
    case 'blockers':
      return 'Unresolved blockers can stall campaigns until they are visible, owned, and tracked.';
    case 'summarize':
      return 'A concise, evidence-backed picture reduces rework before you commit to the next move.';
    case 'show_evidence':
      return 'Seeing the underlying source lets you verify claims before acting on them.';
    default:
      return `This connects "${context.searchQuery}" to indexed repository knowledge you can act on.`;
  }
}

function recommendNext(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  if (confidence.level === 'insufficient') {
    return 'Rephrase the question with a campaign or KRC label, or use Search to scan the raw index.';
  }

  const lead = leadItem(context);
  const session = context.executiveSessions[0];
  const explorer = context.items.find((item) => item.explorerPath)?.explorerPath;

  if (context.intent === 'blockers') {
    return lead
      ? `Open "${lead.title}" and decide whether to add this blocker to your active campaign tracker.`
      : 'Ask me which campaign this blocker affects, then we can trace ownership.';
  }

  if (context.intent === 'decision' && session) {
    return `Continue the "${session.title}" thread — ask what was decided, or open it in Explorer to verify.`;
  }

  if (session) {
    return `Pick up the executive session on "${session.title}" and ask what we should do next there.`;
  }

  if (lead?.explorerPath) {
    return `Open "${lead.title}" in Explorer, then ask me to explain how it affects your current objective.`;
  }

  if (explorer) {
    return 'Open the lead source in Explorer and ask me to connect it to your current campaign.';
  }

  return `Ask me to go deeper on "${context.searchQuery}" or name the campaign you want to steer toward.`;
}

/** Executive steering envelope — conversational, guided delivery. */
export function buildSteeringDirectAnswer(
  context: AssembledEvidenceContext,
  confidence: VigsyConfidence,
): string {
  const topic = context.searchQuery;
  const changed = sanitizeGist(whatChanged(context, confidence));
  const matters = sanitizeGist(whyItMatters(context, confidence));
  const next = sanitizeGist(recommendNext(context, confidence));

  if (confidence.level === 'insufficient') {
    return [
      `I looked through what we have on "${topic}", but the evidence is thin.`,
      changed,
      matters,
      'If you want, we can rephrase with a campaign or KRC name — or I can scan Search with you.',
    ].join('\n\n');
  }

  return [
    `On "${topic}" — ${changed}`,
    matters,
    `I would start here: ${next}`,
    'Use the options below — timeline, sources, conversation — and I will stay with you on this thread.',
  ].join('\n\n');
}

function sanitizeGist(text: string): string {
  return text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Brief pointer to expandable evidence — not a report dump. */
export function buildSteeringSupportingSummary(
  context: AssembledEvidenceContext,
  confidence: VigsyConfidence,
): string {
  if (context.items.length === 0) {
    return 'No supporting records to cite — expand Search if you need raw hits.';
  }

  const krc = context.topKrcIds.slice(0, 4).join(', ');
  const confidenceNote =
    confidence.level === 'high'
      ? 'High confidence'
      : confidence.level === 'medium'
        ? 'Medium confidence'
        : confidence.level === 'low'
          ? 'Lower confidence'
          : 'Limited confidence';

  return `${confidenceNote} — I am drawing on ${context.items.length} indexed record(s)${krc ? ` across ${krc}` : ''}. Say the word if you want me to open any of them with you.`;
}

export function isSteeringFormattedAnswer(text: string): boolean {
  return /what changed\s*[—-]/i.test(text) && /what i recommend next\s*[—-]/i.test(text);
}

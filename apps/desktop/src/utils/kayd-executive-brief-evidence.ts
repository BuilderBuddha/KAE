import type { VigsyEvidenceCitation, VigsyKnowledgeAnswer } from '@scooper/core';

function normalizePath(path: string | undefined | null): string {
  return (path ?? '').replace(/\\/g, '/').trim().toLowerCase();
}

function mergeEvidence(
  investigation: VigsyEvidenceCitation[],
  brief: VigsyEvidenceCitation[],
  selectedEvidencePath?: string | null,
): VigsyEvidenceCitation[] {
  const merged: VigsyEvidenceCitation[] = [];
  const seen = new Set<string>();
  const push = (item: VigsyEvidenceCitation) => {
    if (seen.has(item.recordId)) return;
    seen.add(item.recordId);
    merged.push({ ...item });
  };
  for (const item of investigation) push(item);
  for (const item of brief) push(item);

  const selected = normalizePath(selectedEvidencePath);
  if (!selected) return merged;

  const match = [...investigation, ...brief].find(
    (item) => normalizePath(item.explorerPath) === selected,
  );
  if (!match) return merged;
  const rest = merged.filter((item) => item.recordId !== match.recordId);
  return [{ ...match }, ...rest];
}

export function hasGovernedInvestigationEvidence(
  answer: VigsyKnowledgeAnswer | null | undefined,
): boolean {
  return Boolean(answer?.evidenceUsed && answer.evidenceUsed.length > 0);
}

/**
 * Default evidence scope = active investigation. Selected Explorer paths stay in the freeze set.
 */
export function resolveExecutiveBriefSourceAnswer(input: {
  briefAnswer: VigsyKnowledgeAnswer;
  investigationAnswer: VigsyKnowledgeAnswer | null | undefined;
  selectedEvidencePath?: string | null;
}): { ok: true; answer: VigsyKnowledgeAnswer } | { ok: false; reason: 'no-evidence' } {
  const investigation = input.investigationAnswer ?? null;
  const invEvidence = investigation?.evidenceUsed ?? [];
  const briefEvidence = input.briefAnswer.evidenceUsed ?? [];
  const evidence = mergeEvidence(invEvidence, briefEvidence, input.selectedEvidencePath);
  if (evidence.length === 0) return { ok: false, reason: 'no-evidence' };

  const base = invEvidence.length > 0 && investigation ? investigation : input.briefAnswer;
  const prose = input.briefAnswer.directAnswer.trim() ? input.briefAnswer : base;

  return {
    ok: true,
    answer: {
      ...input.briefAnswer,
      intent: 'executive_brief',
      searchQuery: base.searchQuery || input.briefAnswer.searchQuery,
      evidenceUsed: evidence,
      confidence: base.confidence,
      directAnswer: prose.directAnswer,
      reasonedSummary: prose.reasonedSummary || base.reasonedSummary,
      explorerLinks: base.explorerLinks?.length ? base.explorerLinks : input.briefAnswer.explorerLinks,
      timeline: base.timeline?.length ? base.timeline : input.briefAnswer.timeline,
      relatedSources: base.relatedSources?.length
        ? base.relatedSources
        : input.briefAnswer.relatedSources,
      attachments: base.attachments?.length ? base.attachments : input.briefAnswer.attachments,
    },
  };
}

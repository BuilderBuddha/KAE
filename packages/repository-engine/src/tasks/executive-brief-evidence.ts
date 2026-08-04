import type { VigsyEvidenceCitation, VigsyKnowledgeAnswer } from '@scooper/core';

function normalizePath(path: string | undefined | null): string {
  return (path ?? '').replace(/\\/g, '/').trim().toLowerCase();
}

function mergeEvidencePreferringInvestigation(
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
  if (selected) {
    const match = [...investigation, ...brief].find(
      (item) => normalizePath(item.explorerPath) === selected,
    );
    if (match) {
      // Keep selected evidence first while preserving freeze completeness.
      const rest = merged.filter((item) => item.recordId !== match.recordId);
      return [{ ...match }, ...rest];
    }
  }

  return merged;
}

export function hasGovernedInvestigationEvidence(
  answer: VigsyKnowledgeAnswer | null | undefined,
): boolean {
  return Boolean(answer?.evidenceUsed && answer.evidenceUsed.length > 0);
}

export type ResolveExecutiveBriefSourceResult =
  | { ok: true; answer: VigsyKnowledgeAnswer; usedInvestigationEvidence: boolean }
  | { ok: false; reason: 'no-evidence' };

/**
 * Default evidence scope for a new Executive Brief is the active investigation.
 * Selected repository evidence is preserved when present in the governed set.
 * Freeze identities come from this resolved answer at prepare time.
 */
export function resolveExecutiveBriefSourceAnswer(input: {
  briefAnswer: VigsyKnowledgeAnswer;
  investigationAnswer: VigsyKnowledgeAnswer | null | undefined;
  selectedEvidencePath?: string | null;
}): ResolveExecutiveBriefSourceResult {
  const investigation = input.investigationAnswer ?? null;
  const invEvidence = investigation?.evidenceUsed ?? [];
  const briefEvidence = input.briefAnswer.evidenceUsed ?? [];
  const evidence = mergeEvidencePreferringInvestigation(
    invEvidence,
    briefEvidence,
    input.selectedEvidencePath,
  );

  if (evidence.length === 0) {
    return { ok: false, reason: 'no-evidence' };
  }

  const usedInvestigationEvidence = invEvidence.length > 0;
  const base = usedInvestigationEvidence && investigation ? investigation : input.briefAnswer;
  const proseSource = input.briefAnswer.directAnswer.trim()
    ? input.briefAnswer
    : base;

  return {
    ok: true,
    usedInvestigationEvidence,
    answer: {
      ...input.briefAnswer,
      intent: 'executive_brief',
      question: input.briefAnswer.question || base.question,
      searchQuery: base.searchQuery || input.briefAnswer.searchQuery,
      evidenceUsed: evidence,
      confidence: base.confidence,
      directAnswer: proseSource.directAnswer,
      reasonedSummary: proseSource.reasonedSummary || base.reasonedSummary,
      explorerLinks: base.explorerLinks?.length ? base.explorerLinks : input.briefAnswer.explorerLinks,
      timeline: base.timeline?.length ? base.timeline : input.briefAnswer.timeline,
      relatedSources: base.relatedSources?.length
        ? base.relatedSources
        : input.briefAnswer.relatedSources,
      attachments: base.attachments?.length ? base.attachments : input.briefAnswer.attachments,
    },
  };
}

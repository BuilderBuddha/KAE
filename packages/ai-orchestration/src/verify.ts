import type { ReasoningResponse, VigsyKnowledgeAnswer } from '@scooper/core';

function claimsSourceMissing(text: string, krcId: string): boolean {
  const lower = text.toLowerCase();
  const id = krcId.toLowerCase();
  if (!lower.includes(id)) return /untracked|not present|does not exist|no available source|missing in the (current )?repository/.test(lower);
  return (
    new RegExp(
      `${id}[^.]{0,80}(untracked|missing|does not exist|no available source|not present|not (found|tracked))`,
      'i',
    ).test(text) ||
    new RegExp(
      `(untracked|missing|does not exist|no available source|not present)[^.]{0,80}${id}`,
      'i',
    ).test(text)
  );
}

function filterEvidenceToScope(skeleton: VigsyKnowledgeAnswer): VigsyKnowledgeAnswer['evidenceUsed'] {
  const scope = skeleton.sourceScope;
  if (!scope || scope.authority === 'none' || scope.authorizedKrcIds.length === 0) {
    return skeleton.evidenceUsed;
  }
  const allowed = new Set(scope.authorizedKrcIds.map((id) => id.toUpperCase()));
  return skeleton.evidenceUsed.filter((item) => {
    if (!item.krcId) return false;
    return allowed.has(item.krcId.toUpperCase());
  });
}

/**
 * Ensures provider output cannot replace grounded evidence fields or contradict
 * deterministic source identity/status. Falls back to the skeleton when grounding fails.
 */
export function verifyGroundedAnswer(
  skeleton: VigsyKnowledgeAnswer,
  response: ReasoningResponse,
): VigsyKnowledgeAnswer {
  const scopedEvidence = filterEvidenceToScope(skeleton);

  if (
    skeleton.lockDeterministicProse ||
    skeleton.intent === 'source_lookup' ||
    skeleton.intent === 'project_topic' ||
    skeleton.intent === 'relationship_trace'
  ) {
    return {
      ...skeleton,
      evidenceUsed: scopedEvidence,
      relatedSources: skeleton.sourceScope?.authority !== 'none' ? [] : skeleton.relatedSources,
      reasoningProviderId: response.providerId,
      usedOfflineFallback: Boolean(response.usedOfflineFallback),
    };
  }

  let directAnswer = response.directAnswer.trim() || skeleton.directAnswer;
  let reasonedSummary = response.reasonedSummary.trim() || skeleton.reasonedSummary;
  let usedFallback = Boolean(response.usedOfflineFallback);

  const statuses = skeleton.sourceStatuses ?? [];
  for (const status of statuses) {
    if (status.status === 'does_not_exist') continue;
    if (claimsSourceMissing(directAnswer, status.krcId) || claimsSourceMissing(reasonedSummary, status.krcId)) {
      directAnswer = skeleton.directAnswer;
      reasonedSummary = skeleton.reasonedSummary;
      usedFallback = true;
      break;
    }
  }

  // Reject citations outside authorized scope (provider cannot add sources).
  const providerMentionedForeign = /KRC-\d{4}/gi.test(directAnswer)
    ? extractKrcs(directAnswer).some((id) => {
        if (!skeleton.sourceScope || skeleton.sourceScope.authority === 'none') return false;
        return !skeleton.sourceScope.authorizedKrcIds.includes(id);
      })
    : false;

  if (providerMentionedForeign) {
    directAnswer = skeleton.directAnswer;
    reasonedSummary = skeleton.reasonedSummary;
    usedFallback = true;
  }

  return {
    question: skeleton.question,
    intent: skeleton.intent,
    searchQuery: skeleton.searchQuery,
    directAnswer,
    reasonedSummary,
    evidenceUsed: scopedEvidence,
    confidence: skeleton.confidence,
    timeline: skeleton.timeline,
    relatedSources:
      skeleton.sourceScope?.authority !== 'none' ? [] : skeleton.relatedSources,
    attachments: skeleton.attachments.filter((item) => {
      if (!skeleton.sourceScope || skeleton.sourceScope.authority === 'none') return true;
      if (!item.krcId) return false;
      return skeleton.sourceScope.authorizedKrcIds.includes(item.krcId.toUpperCase());
    }),
    explorerLinks: skeleton.explorerLinks,
    relationshipInsights: skeleton.relationshipInsights,
    sourceStatuses: skeleton.sourceStatuses,
    sourceScope: skeleton.sourceScope,
    suppressExecutiveMemory: skeleton.suppressExecutiveMemory,
    lockDeterministicProse: skeleton.lockDeterministicProse,
    reasoningProviderId: response.providerId,
    usedOfflineFallback: usedFallback,
  };
}

function extractKrcs(text: string): string[] {
  const ids: string[] = [];
  const re = /\bKRC-(\d{4})\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ids.push(`KRC-${match[1]}`);
  }
  return ids;
}

export function evidenceFingerprint(answer: VigsyKnowledgeAnswer): string {
  return [
    answer.evidenceUsed.map((item) => item.recordId).join('|'),
    answer.attachments.map((item) => item.recordId).join('|'),
    answer.explorerLinks.map((item) => item.path).join('|'),
  ].join('::');
}

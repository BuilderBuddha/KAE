import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { InvestigationView } from '../../utils/investigation-workflow';

interface VigsyEvidencePanelProps {
  answer: VigsyKnowledgeAnswer;
  onContinueView: (view: InvestigationView) => void;
  busy?: boolean;
}

function CapabilityTrigger({
  title,
  disabled,
  onContinue,
}: {
  title: string;
  disabled?: boolean;
  onContinue: () => void;
}) {
  return (
    <section className="vigsy-evidence-card vigsy-evidence-card--trigger">
      <button
        type="button"
        className="vigsy-evidence-card__toggle"
        onClick={onContinue}
        disabled={disabled}
        aria-label={`${title} — continue in chat`}
      >
        <span>{title}</span>
        <span aria-hidden>→</span>
      </button>
    </section>
  );
}

function countRelatedKnowledge(answer: VigsyKnowledgeAnswer): number {
  const relatedItems = [
    ...answer.relatedSources,
    ...(answer.relationshipInsights?.relatedDecisions ?? []),
    ...(answer.relationshipInsights?.relatedConversations ?? []),
    ...(answer.relationshipInsights?.relatedCampaigns ?? []),
    ...(answer.relationshipInsights?.relatedAttachments ?? []),
    ...(answer.relationshipInsights?.relatedExecutiveSessions ?? []),
  ];
  const seen = new Set<string>();
  return relatedItems.filter((item) => {
    if (seen.has(item.recordId)) return false;
    seen.add(item.recordId);
    return true;
  }).length;
}

function countConversationLinks(answer: VigsyKnowledgeAnswer): number {
  if (answer.explorerLinks.length) return answer.explorerLinks.length;
  return answer.evidenceUsed.filter((item) => item.kind === 'conversation' || item.kind === 'source')
    .length;
}

/** Supporting capability rows — each click continues the investigation in chat. */
export function VigsyEvidencePanel({ answer, onContinueView, busy }: VigsyEvidencePanelProps) {
  const relatedCount = countRelatedKnowledge(answer);
  const conversationCount = countConversationLinks(answer);

  return (
    <div className="vigsy-evidence-panel" role="group" aria-label="Investigation capabilities">
      <CapabilityTrigger
        title={`Confidence — ${answer.confidence.level} (${answer.confidence.score}/100)`}
        disabled={busy}
        onContinue={() => onContinueView('confidence')}
      />
      <CapabilityTrigger
        title={`Supporting Evidence (${answer.evidenceUsed.length})`}
        disabled={busy}
        onContinue={() => onContinueView('sources')}
      />
      <CapabilityTrigger
        title={`Timeline (${answer.timeline.length})`}
        disabled={busy}
        onContinue={() => onContinueView('timeline')}
      />
      <CapabilityTrigger
        title={`Related Knowledge (${relatedCount})`}
        disabled={busy}
        onContinue={() => onContinueView('related')}
      />
      <CapabilityTrigger
        title={`Open Conversation (${conversationCount})`}
        disabled={busy}
        onContinue={() => onContinueView('conversation')}
      />
    </div>
  );
}

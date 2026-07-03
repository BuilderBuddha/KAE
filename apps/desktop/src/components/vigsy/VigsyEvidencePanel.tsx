import { useState, type ReactNode } from 'react';
import type { VigsyKnowledgeAnswer } from '@scooper/core';
import { useNavigation } from '../../context/NavigationContext';

function confidenceClass(level: VigsyKnowledgeAnswer['confidence']['level']): string {
  return `vigsy-confidence vigsy-confidence--${level}`;
}

interface VigsyEvidencePanelProps {
  answer: VigsyKnowledgeAnswer;
  expandedSections?: Set<string>;
}

function ExpandableCard({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <section className={`vigsy-evidence-card${expanded ? ' vigsy-evidence-card--open' : ''}`}>
      <button type="button" className="vigsy-evidence-card__toggle" onClick={() => onToggle(id)}>
        <span>{title}</span>
        <span aria-hidden>{expanded ? '−' : '+'}</span>
      </button>
      {expanded ? <div className="vigsy-evidence-card__body">{children}</div> : null}
    </section>
  );
}

export function VigsyEvidencePanel({ answer, expandedSections }: VigsyEvidencePanelProps) {
  const { openInExplorer } = useNavigation();
  const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set());

  const expanded = expandedSections ?? localExpanded;
  const toggle = (id: string) => {
    if (expandedSections) return;
    setLocalExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const relatedItems: Array<{
    recordId: string;
    label: string;
    excerpt?: string;
    explorerPath: string;
    reason?: string;
  }> = [
    ...answer.relatedSources.map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
    })),
    ...(answer.relationshipInsights?.relatedDecisions ?? []).map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
      reason: item.reason,
    })),
    ...(answer.relationshipInsights?.relatedConversations ?? []).map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
      reason: item.reason,
    })),
    ...(answer.relationshipInsights?.relatedCampaigns ?? []).map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
      reason: item.reason,
    })),
    ...(answer.relationshipInsights?.relatedAttachments ?? []).map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
      reason: item.reason,
    })),
    ...(answer.relationshipInsights?.relatedExecutiveSessions ?? []).map((item) => ({
      recordId: item.recordId,
      label: item.label,
      excerpt: item.excerpt,
      explorerPath: item.explorerPath,
      reason: item.reason,
    })),
  ];

  const seenRelated = new Set<string>();
  const uniqueRelated = relatedItems.filter((item) => {
    if (seenRelated.has(item.recordId)) return false;
    seenRelated.add(item.recordId);
    return true;
  });

  const conversationLinks = answer.explorerLinks.length
    ? answer.explorerLinks
    : answer.evidenceUsed
        .filter((item) => item.kind === 'conversation' || item.kind === 'source')
        .map((item) => ({
          label: item.label,
          path: item.explorerPath,
          krcId: item.krcId,
        }));

  return (
    <div className="vigsy-evidence-panel">
      <ExpandableCard
        id="confidence"
        title={`Confidence — ${answer.confidence.level} (${answer.confidence.score}/100)`}
        expanded={expanded.has('confidence')}
        onToggle={toggle}
      >
        <div className={confidenceClass(answer.confidence.level)}>{answer.confidence.rationale}</div>
      </ExpandableCard>

      <ExpandableCard
        id="evidence"
        title={`Supporting Evidence (${answer.evidenceUsed.length})`}
        expanded={expanded.has('evidence')}
        onToggle={toggle}
      >
        <ul className="vigsy-evidence-list">
          {answer.evidenceUsed.map((item) => (
            <li key={item.recordId} className="vigsy-evidence-item">
              <div className="vigsy-evidence-item__head">
                <span className="vigsy-evidence-item__label">{item.label}</span>
                {item.krcId ? <span className="vigsy-evidence-item__krc">{item.krcId}</span> : null}
              </div>
              <p className="vigsy-evidence-item__excerpt">{item.excerpt}</p>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => openInExplorer(item.explorerPath)}
              >
                Open in Explorer
              </button>
            </li>
          ))}
        </ul>
        {answer.attachments.length > 0 ? (
          <ul className="vigsy-evidence-list">
            {answer.attachments.map((item) => (
              <li key={item.recordId} className="vigsy-evidence-item">
                <span className="vigsy-evidence-item__label">{item.label}</span>
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => openInExplorer(item.explorerPath)}
                >
                  Open in Explorer
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </ExpandableCard>

      <ExpandableCard
        id="timeline"
        title={`Timeline (${answer.timeline.length})`}
        expanded={expanded.has('timeline')}
        onToggle={toggle}
      >
        {answer.timeline.length === 0 ? (
          <p className="muted">No timeline steps.</p>
        ) : (
          <div className="evidence-timeline">
            {answer.timeline.map((step, index) => (
              <div key={`${step.kind}-${step.label}`} className="evidence-timeline__step">
                {index > 0 ? <div className="evidence-timeline__arrow" aria-hidden>↓</div> : null}
                <button
                  type="button"
                  className="evidence-timeline__card"
                  onClick={() => openInExplorer(step.explorerPath)}
                >
                  <span className="evidence-timeline__kind">{step.kind.replace(/_/g, ' ')}</span>
                  <span className="evidence-timeline__label">{step.label}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </ExpandableCard>

      <ExpandableCard
        id="related"
        title={`Related Knowledge (${uniqueRelated.length})`}
        expanded={expanded.has('related')}
        onToggle={toggle}
      >
        {uniqueRelated.length === 0 ? (
          <p className="muted">No related knowledge surfaced for this answer.</p>
        ) : (
          <ul className="vigsy-evidence-list">
            {uniqueRelated.map((item) => (
              <li key={item.recordId} className="vigsy-evidence-item">
                <span className="vigsy-evidence-item__label">{item.label}</span>
                {item.reason ? (
                  <p className="vigsy-evidence-item__excerpt">{item.reason}</p>
                ) : null}
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => openInExplorer(item.explorerPath)}
                >
                  Open in Explorer
                </button>
              </li>
            ))}
          </ul>
        )}
      </ExpandableCard>

      <ExpandableCard
        id="conversation"
        title={`Open Conversation (${conversationLinks.length})`}
        expanded={expanded.has('conversation')}
        onToggle={toggle}
      >
        <div className="vigsy-explorer-links">
          {conversationLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              className="btn btn--primary btn--small"
              onClick={() => openInExplorer(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>
      </ExpandableCard>
    </div>
  );
}

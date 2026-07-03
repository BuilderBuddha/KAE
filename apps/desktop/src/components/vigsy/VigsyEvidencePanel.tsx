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
  const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set(['confidence']));

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

  const decisionItems = answer.relatedSources.filter(
    (item) => item.kind === 'executive_session' || /session|decision/i.test(item.label),
  );

  return (
    <div className="vigsy-evidence-panel">
      <ExpandableCard
        id="confidence"
        title={`Confidence — ${answer.confidence.level} (${answer.confidence.score}/100)`}
        expanded={expanded.has('confidence')}
        onToggle={toggle}
      >
        <div className={confidenceClass(answer.confidence.level)}>
          {answer.confidence.rationale}
        </div>
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
        id="attachments"
        title={`Attachments (${answer.attachments.length})`}
        expanded={expanded.has('attachments')}
        onToggle={toggle}
      >
        {answer.attachments.length === 0 ? (
          <p className="muted">No attachments in this answer.</p>
        ) : (
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
        )}
      </ExpandableCard>

      <ExpandableCard
        id="explorer"
        title={`Explorer Links (${answer.explorerLinks.length})`}
        expanded={expanded.has('explorer')}
        onToggle={toggle}
      >
        <div className="vigsy-explorer-links">
          {answer.explorerLinks.map((link) => (
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

      <ExpandableCard
        id="decisions"
        title={`Related Decisions (${decisionItems.length || answer.relatedSources.length})`}
        expanded={expanded.has('decisions')}
        onToggle={toggle}
      >
        <ul className="vigsy-link-list">
          {(decisionItems.length > 0 ? decisionItems : answer.relatedSources).map((item) => (
            <li key={item.recordId}>
              <button
                type="button"
                className="vigsy-link-list__btn"
                onClick={() => openInExplorer(item.explorerPath)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </ExpandableCard>

      {answer.relationshipInsights ? (
        <ExpandableCard
          id="relationships"
          title="Related Evidence (Relationships)"
          expanded={expanded.has('relationships')}
          onToggle={toggle}
        >
          {(
            [
              ['Related Decisions', answer.relationshipInsights.relatedDecisions],
              ['Related Conversations', answer.relationshipInsights.relatedConversations],
              ['Related Campaigns', answer.relationshipInsights.relatedCampaigns],
              ['Related Attachments', answer.relationshipInsights.relatedAttachments],
              ['Related Executive Sessions', answer.relationshipInsights.relatedExecutiveSessions],
            ] as const
          ).map(([label, items]) =>
            items.length > 0 ? (
              <div key={label} className="vigsy-relationship-group">
                <h4 className="vigsy-relationship-group__title">{label}</h4>
                <ul className="vigsy-evidence-list">
                  {items.map((item) => (
                    <li key={`${label}-${item.recordId}`} className="vigsy-evidence-item">
                      <span className="vigsy-evidence-item__label">{item.label}</span>
                      <p className="vigsy-evidence-item__excerpt">{item.reason}</p>
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
              </div>
            ) : null,
          )}
        </ExpandableCard>
      ) : null}
    </div>
  );
}

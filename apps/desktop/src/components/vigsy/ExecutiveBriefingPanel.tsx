import type { ExecutiveAwarenessCard, ExecutiveBriefing } from '@scooper/core';
import { useNavigation } from '../../context/NavigationContext';

const CATEGORY_LABELS: Record<ExecutiveAwarenessCard['category'], string> = {
  recent_decision: 'Recent Decision',
  recent_blocker: 'Blocker',
  recent_import: 'Recent Import',
  high_relationship_topic: 'High-Relationship Topic',
  suggested_next_action: 'Suggested Action',
  repository_health: 'Repository Health',
};

interface ExecutiveBriefingPanelProps {
  briefing: ExecutiveBriefing | null;
  loading: boolean;
  backgroundRefreshing?: boolean;
  onRefresh: () => void;
  variant?: 'panel' | 'inline';
}

export function ExecutiveBriefingPanel({
  briefing,
  loading,
  backgroundRefreshing = false,
  onRefresh,
  variant = 'panel',
}: ExecutiveBriefingPanelProps) {
  const { openInExplorer } = useNavigation();
  const inline = variant === 'inline';

  return (
    <section className={`vigsy-briefing${inline ? ' vigsy-briefing--inline' : ' card'}`}>
      <header className="vigsy-briefing__header">
        <div>
          <h2 className="vigsy-briefing__title">
            {inline ? 'Supporting awareness' : 'Executive Briefing'}
          </h2>
          {!inline ? (
            <p className="vigsy-briefing__subtitle muted">
              Deterministic awareness from evidence, relationships, imports, and repository health.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn--secondary btn--small vigsy-briefing__refresh"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {loading && !briefing ? (
        <p className="muted vigsy-briefing__loading">Building executive briefing…</p>
      ) : null}

      {briefing ? (
        <>
          <p className="vigsy-briefing__meta muted">
            {briefing.cards.length} cards · {briefing.evidenceRecordCount.toLocaleString()} evidence
            records · {briefing.relationshipCount.toLocaleString()} relationships
            {backgroundRefreshing ? ' · Updating…' : ''}
          </p>
          <div className="vigsy-briefing__grid">
            {briefing.cards.map((card) => (
              <article key={card.cardId} className="vigsy-briefing-card">
                <div className="vigsy-briefing-card__head">
                  <span className="vigsy-briefing-card__category">
                    {CATEGORY_LABELS[card.category]}
                  </span>
                  <span className="vigsy-briefing-card__confidence">{card.confidence}% confidence</span>
                </div>
                <h3 className="vigsy-briefing-card__title">{card.title}</h3>
                <p className="vigsy-briefing-card__summary">{card.summary}</p>
                <p className="vigsy-briefing-card__why muted">
                  <strong>Why it matters:</strong> {card.whyItMatters}
                </p>
                {card.evidenceLinks.length > 0 ? (
                  <ul className="vigsy-briefing-card__links">
                    {card.evidenceLinks.map((link) => (
                      <li key={`${card.cardId}-${link.recordId ?? link.explorerPath}`}>
                        <span className="vigsy-briefing-card__link-label">{link.label}</span>
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          onClick={() => openInExplorer(link.explorerPath)}
                        >
                          Open in Explorer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted vigsy-briefing-card__empty">No evidence links for this card.</p>
                )}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

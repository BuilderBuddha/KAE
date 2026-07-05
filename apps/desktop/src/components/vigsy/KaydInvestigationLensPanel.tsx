import type { VigsyEvidenceCitation, VigsyKnowledgeAnswer } from '@scooper/core';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { investigationViewFromLens } from '../../utils/investigation-workflow';

function CitationList({ items, empty }: { items: VigsyEvidenceCitation[]; empty: string }) {
  const { openInExplorer } = useNavigation();
  if (items.length === 0) return <p className="muted kayd-lens-panel__empty">{empty}</p>;
  return (
    <ul className="kayd-lens-panel__list">
      {items.map((item) => (
        <li key={item.recordId}>
          <button
            type="button"
            className="kayd-lens-panel__item"
            onClick={() => openInExplorer(item.explorerPath)}
          >
            <span className="kayd-lens-panel__item-title">{item.label}</span>
            <span className="kayd-lens-panel__item-excerpt muted">{item.excerpt}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function lensBody(answer: VigsyKnowledgeAnswer, lens: string | null) {
  const view = investigationViewFromLens(lens);
  const topic = answer.searchQuery;

  switch (view) {
    case 'timeline':
      if (answer.timeline.length === 0) {
        return <p className="muted">No timeline steps indexed for &ldquo;{topic}&rdquo; yet.</p>;
      }
      return (
        <ol className="kayd-lens-panel__timeline">
          {answer.timeline.map((step) => (
            <li key={`${step.explorerPath}-${step.label}`}>
              <span className="kayd-lens-panel__timeline-label">{step.label}</span>
              {step.timestamp ? (
                <span className="kayd-lens-panel__timeline-time muted">
                  {new Date(step.timestamp).toLocaleString()}
                </span>
              ) : null}
              {step.subtitle ? <p className="muted">{step.subtitle}</p> : null}
            </li>
          ))}
        </ol>
      );
    case 'sources':
      return (
        <CitationList
          items={answer.evidenceUsed}
          empty={`No corroborating sources surfaced for "${topic}".`}
        />
      );
    case 'images': {
      const images = answer.attachments.filter((item) =>
        /\.(png|jpe?g|gif|webp|svg)$/i.test(item.label),
      );
      return (
        <CitationList items={images} empty={`No images found for "${topic}".`} />
      );
    }
    case 'videos': {
      const videos = answer.attachments.filter((item) =>
        /\.(mp4|webm|mov|m4v)$/i.test(item.label) || /video/i.test(item.label),
      );
      return (
        <CitationList items={videos} empty={`No videos found for "${topic}".`} />
      );
    }
    case 'related':
      return (
        <CitationList
          items={answer.relatedSources}
          empty={`No related knowledge links for "${topic}".`}
        />
      );
    case 'repository':
      return (
        <CitationList
          items={answer.explorerLinks.map((link) => ({
            recordId: link.path,
            label: link.label,
            excerpt: link.path,
            explorerPath: link.path,
            krcId: link.krcId,
            kind: 'source' as const,
          }))}
          empty={`No repository paths anchored for "${topic}".`}
        />
      );
    case 'conversation':
      return (
        <CitationList
          items={answer.evidenceUsed.filter((item) => item.kind === 'message')}
          empty={`No open conversation threads matched "${topic}".`}
        />
      );
    case 'confidence':
      return (
        <p className="kayd-lens-panel__confidence">
          Confidence: <strong>{answer.confidence.level}</strong> ({answer.confidence.score}/100) —{' '}
          {answer.confidence.rationale}
        </p>
      );
    case 'why':
    case 'summarize':
      return (
        <CitationList
          items={answer.evidenceUsed.slice(0, 6)}
          empty={`No supporting records for this ${view} view.`}
        />
      );
    default:
      return null;
  }
}

/** Lens-specific evidence slice — unique capability data, not the executive conversation. */
export function KaydInvestigationLensPanel() {
  const { investigationLens, latestInvestigationAnswer, investigationActive } = useVigsyConversation();

  if (!investigationActive || !investigationLens || !latestInvestigationAnswer) return null;

  const body = lensBody(latestInvestigationAnswer, investigationLens);
  if (!body) return null;

  return (
    <section className="kayd-lens-panel card" aria-label={`${investigationLens} for active investigation`}>
      <h3 className="kayd-lens-panel__title">{investigationLens}</h3>
      {body}
    </section>
  );
}

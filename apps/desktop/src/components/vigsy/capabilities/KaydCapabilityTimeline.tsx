import type { VigsyKnowledgeAnswer } from '@scooper/core';
import { useNavigation } from '../../../context/NavigationContext';

/** Chronological sequence — timeline capability only. */
export function KaydCapabilityTimeline({ answer }: { answer: VigsyKnowledgeAnswer }) {
  const { openInExplorer } = useNavigation();

  if (answer.timeline.length === 0) {
    return <p className="muted kayd-capability__empty">No timeline events indexed for this investigation.</p>;
  }

  return (
    <ol className="kayd-capability-timeline">
      {answer.timeline.map((step) => (
        <li key={`${step.explorerPath}-${step.label}`} className="kayd-capability-timeline__step">
          <button
            type="button"
            className="kayd-capability-timeline__btn"
            onClick={() => openInExplorer(step.explorerPath)}
          >
            <span className="kayd-capability-timeline__label">{step.label}</span>
            {step.timestamp ? (
              <time className="kayd-capability-timeline__time muted">
                {new Date(step.timestamp).toLocaleString()}
              </time>
            ) : null}
            {step.subtitle ? <span className="kayd-capability-timeline__sub muted">{step.subtitle}</span> : null}
          </button>
        </li>
      ))}
    </ol>
  );
}

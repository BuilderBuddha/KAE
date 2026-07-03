import type {
  EvidenceDrilldown,
  EvidenceDrilldownLink,
  EvidenceDrilldownSection,
  EvidenceTimelineStep,
} from '@scooper/core';
import { useNavigation } from '../context/NavigationContext';

const SECTION_ORDER: Array<keyof EvidenceDrilldown['sections']> = [
  'decisionSummary',
  'sourceFile',
  'conversation',
  'messages',
  'attachments',
  'executiveSession',
  'relatedSources',
  'timeline',
];

const TIMELINE_LABELS: Record<EvidenceTimelineStep['kind'], string> = {
  conversation: 'Conversation',
  executive_session: 'Executive Session',
  related_sources: 'Related Sources',
  newest_evidence: 'Newest Evidence',
};

function DrilldownLinkButton({
  item,
  onOpen,
}: {
  item: EvidenceDrilldownLink;
  onOpen: (path: string) => void;
}) {
  return (
    <button
      type="button"
      className={`evidence-drilldown__link${item.highlighted ? ' evidence-drilldown__link--highlight' : ''}`}
      onClick={() => onOpen(item.explorerPath)}
    >
      <span className="evidence-drilldown__link-label">{item.label}</span>
      {item.subtitle ? <span className="evidence-drilldown__link-sub">{item.subtitle}</span> : null}
    </button>
  );
}

function DrilldownSectionView({
  section,
  onOpen,
}: {
  section: EvidenceDrilldownSection;
  onOpen: (path: string) => void;
}) {
  return (
    <section className="evidence-drilldown__section">
      <h3 className="evidence-drilldown__section-title">{section.title}</h3>
      {section.items.length === 0 ? (
        <p className="muted evidence-drilldown__empty">{section.emptyMessage ?? 'No items.'}</p>
      ) : (
        <div className="evidence-drilldown__items">
          {section.items.map((item) => (
            <DrilldownLinkButton key={`${section.id}-${item.label}-${item.explorerPath}`} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineView({
  steps,
  onOpen,
}: {
  steps: EvidenceTimelineStep[];
  onOpen: (path: string) => void;
}) {
  return (
    <div className="evidence-timeline">
      {steps.map((step, index) => (
        <div key={`${step.kind}-${step.label}`} className="evidence-timeline__step">
          {index > 0 ? <div className="evidence-timeline__arrow" aria-hidden>↓</div> : null}
          <button type="button" className="evidence-timeline__card" onClick={() => onOpen(step.explorerPath)}>
            <span className="evidence-timeline__kind">{TIMELINE_LABELS[step.kind]}</span>
            <span className="evidence-timeline__label">{step.label}</span>
            {step.subtitle ? <span className="evidence-timeline__sub">{step.subtitle}</span> : null}
            {step.timestamp ? <span className="evidence-timeline__time">{step.timestamp}</span> : null}
          </button>
        </div>
      ))}
    </div>
  );
}

export function EvidenceDrilldownPanel({ drilldown }: { drilldown: EvidenceDrilldown }) {
  const { openInExplorer } = useNavigation();

  return (
    <div className="evidence-drilldown">
      <div className="evidence-drilldown__header">
        <h3 className="evidence-drilldown__title">
          Evidence Chain
          {drilldown.anchorKrcId ? ` · ${drilldown.anchorKrcId}` : ''}
        </h3>
        <button
          type="button"
          className="btn btn--primary btn--small"
          onClick={() => openInExplorer(drilldown.anchorSourcePath)}
        >
          Open source in Explorer
        </button>
      </div>

      <TimelineView steps={drilldown.timeline} onOpen={openInExplorer} />

      {SECTION_ORDER.map((key) => (
        <DrilldownSectionView key={key} section={drilldown.sections[key]} onOpen={openInExplorer} />
      ))}
    </div>
  );
}

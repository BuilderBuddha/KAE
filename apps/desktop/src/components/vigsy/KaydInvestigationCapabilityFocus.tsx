import type { ReactNode } from 'react';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { investigationViewFromLens } from '../../utils/investigation-workflow';
import { screenShowsLensNatively } from '../../utils/investigation-capability';
import { KaydCapabilityImages } from './capabilities/KaydCapabilityImages';
import { KaydCapabilityTimeline } from './capabilities/KaydCapabilityTimeline';
import type { ScreenId } from '../../types/navigation';

interface KaydInvestigationCapabilityFocusProps {
  workspaceScreen: ScreenId;
}

/**
 * Lens-specific evidence only when the current screen does not already own that capability.
 * Avoids duplicating Search results, Repository files, etc.
 */
export function KaydInvestigationCapabilityFocus({ workspaceScreen }: KaydInvestigationCapabilityFocusProps) {
  const { investigationActive, investigationLens, latestInvestigationAnswer } = useVigsyConversation();

  if (!investigationActive || !investigationLens || !latestInvestigationAnswer) return null;
  if (screenShowsLensNatively(workspaceScreen, investigationLens)) return null;

  const view = investigationViewFromLens(investigationLens);
  if (!view) return null;

  let body: ReactNode = null;
  if (view === 'timeline') body = <KaydCapabilityTimeline answer={latestInvestigationAnswer} />;
  if (view === 'images') body = <KaydCapabilityImages answer={latestInvestigationAnswer} />;

  if (!body) return null;

  return (
    <section className="kayd-capability-focus" aria-label={investigationLens}>
      <h3 className="kayd-capability-focus__title">{investigationLens}</h3>
      {body}
    </section>
  );
}

import { buildInvestigationSectionLines } from '../../utils/investigation-workflow';
import type { ActiveInvestigation } from '../../utils/investigation-workflow';
import type { ScreenId } from '../../types/navigation';

interface KaydInvestigationSectionHeaderProps {
  workspaceScreen: ScreenId;
  investigation: ActiveInvestigation;
  lens: string | null;
}

/** One-line section context — unique to this capability, not a duplicate KayD answer. */
export function KaydInvestigationSectionHeader({
  workspaceScreen,
  investigation,
  lens,
}: KaydInvestigationSectionHeaderProps) {
  const lines = buildInvestigationSectionLines(workspaceScreen, investigation);
  const lead = lines[0] ?? `Supporting "${investigation.searchQuery}".`;

  return (
    <header className="kayd-investigation-section-header">
      <p className="kayd-investigation-section-header__lead">{lead}</p>
      {lens ? (
        <p className="kayd-investigation-section-header__lens muted">
          Lens: {lens} — synced to this investigation
        </p>
      ) : null}
    </header>
  );
}

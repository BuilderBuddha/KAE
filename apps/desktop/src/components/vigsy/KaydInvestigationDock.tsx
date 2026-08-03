import { useMemo } from 'react';
import { CognitionPulse } from './CognitionPulse';
import { KaydInvestigationComposer } from './KaydInvestigationComposer';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { kaydReasoningStatusLabel } from '../../utils/kayd-provider-status';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../../utils/kayd-workspace';
import type { ScreenId } from '../../types/navigation';

interface KaydInvestigationDockProps {
  activeScreen: ScreenId;
}

/**
 * Persistent investigation dock — anchored in the shell viewport, outside screen remounts.
 * Visible only while an investigation is active on Dashboard / Search / Repository.
 */
export function KaydInvestigationDock({ activeScreen }: KaydInvestigationDockProps) {
  const { navigate } = useNavigation();
  const { busy, turns, activeInvestigation, hasConversation } = useVigsyConversation();

  const latestAssistant = useMemo(() => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index];
      if (turn.role === 'assistant') return turn;
    }
    return null;
  }, [turns]);

  const statusLabel = busy
    ? 'Thinking through your repository…'
    : kaydReasoningStatusLabel(latestAssistant, 'With you on this');

  const answerReady =
    !busy &&
    Boolean(latestAssistant) &&
    !latestAssistant?.thinking &&
    !latestAssistant?.streaming &&
    Boolean(latestAssistant?.text?.trim() || latestAssistant?.error);

  const topic =
    activeInvestigation?.topic ??
    activeInvestigation?.searchQuery ??
    (hasConversation ? 'Active conversation' : '');

  return (
    <aside
      className="kayd-investigation-dock"
      aria-label="KayD investigation composer"
      data-screen={activeScreen}
    >
      <div className="kayd-investigation-dock__bar">
        <div className="kayd-investigation-dock__meta">
          <span className="kayd-investigation-dock__brand" aria-hidden>
            ✦
          </span>
          <div className="kayd-investigation-dock__meta-text">
            <p className="kayd-investigation-dock__topic" title={topic}>
              {topic || 'Active investigation'}
            </p>
            <p className="kayd-investigation-dock__status" aria-live="polite">
              {busy ? (
                <span className="kayd-investigation-dock__thinking">
                  <CognitionPulse compact />
                  <span>{statusLabel}</span>
                </span>
              ) : answerReady ? (
                <span>KayD answered · {statusLabel}</span>
              ) : (
                <span>{statusLabel}</span>
              )}
            </p>
          </div>
        </div>
        {hasConversation ? (
          <button
            type="button"
            className="kayd-investigation-dock__open btn btn--secondary btn--sm"
            onClick={() => navigate('vigsy')}
          >
            Open KayD
          </button>
        ) : null}
      </div>
      <KaydInvestigationComposer
        composerId={KAYD_WORKSPACE_COMPOSER_ID}
        className="kayd-investigation-composer--dock"
        rows={1}
        workspaceScreen={activeScreen}
      />
    </aside>
  );
}

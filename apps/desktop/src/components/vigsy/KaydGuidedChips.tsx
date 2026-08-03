import type { ExecutiveContinuity } from '@scooper/core';
import { selectStarterPrompts } from '../../utils/kayd-prompt-suggestions';

interface KaydGuidedChipsProps {
  chips: string[];
  busy: boolean;
  continuity?: ExecutiveContinuity | null;
  onAsk: (question: string) => void;
  /** Primary conversation area shows at most three suggestions. */
  maxVisible?: number;
}

/** Suggested next actions — minimize clicks by guiding the user forward. */
export function KaydGuidedChips({
  chips,
  busy,
  continuity,
  onAsk,
  maxVisible = 3,
}: KaydGuidedChipsProps) {
  const recommendedChip =
    continuity?.recommendedNextAction &&
    !chips.some((chip) =>
      chip.toLowerCase().includes(continuity.recommendedNextAction!.slice(0, 24).toLowerCase()),
    )
      ? continuity.recommendedNextAction
      : null;

  const slotBudget = recommendedChip ? Math.max(0, maxVisible - 1) : maxVisible;
  const displayChips = selectStarterPrompts(chips, slotBudget);

  if (!recommendedChip && displayChips.length === 0) return null;

  return (
    <div className="kayd-guided-chips" data-max-suggestions={maxVisible}>
      <p className="kayd-guided-chips__label muted">Suggested next steps</p>
      <div className="vigsy-chips">
        {recommendedChip ? (
          <button
            type="button"
            className="vigsy-chip vigsy-chip--recommended"
            disabled={busy}
            onClick={() => onAsk(continuity?.session?.currentObjective ?? recommendedChip)}
          >
            Continue
          </button>
        ) : null}
        {displayChips.map((q) => (
          <button key={q} type="button" className="vigsy-chip" disabled={busy} onClick={() => onAsk(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

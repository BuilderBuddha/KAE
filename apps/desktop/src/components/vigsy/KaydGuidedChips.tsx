import type { ExecutiveContinuity } from '@scooper/core';

interface KaydGuidedChipsProps {
  chips: string[];
  busy: boolean;
  continuity?: ExecutiveContinuity | null;
  onAsk: (question: string) => void;
}

/** Suggested next actions — minimize clicks by guiding the user forward. */
export function KaydGuidedChips({ chips, busy, continuity, onAsk }: KaydGuidedChipsProps) {
  const recommendedChip =
    continuity?.recommendedNextAction &&
    !chips.some((chip) =>
      chip.toLowerCase().includes(continuity.recommendedNextAction!.slice(0, 24).toLowerCase()),
    )
      ? continuity.recommendedNextAction
      : null;

  if (!recommendedChip && chips.length === 0) return null;

  return (
    <div className="kayd-guided-chips">
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
        {chips.map((q) => (
          <button
            key={q}
            type="button"
            className="vigsy-chip"
            disabled={busy}
            onClick={() => onAsk(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

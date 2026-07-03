/** Thinking presence indicator ported from VIGS `VigsyConversation` CognitionPulse. */
export function CognitionPulse({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`vigsy-cognition${compact ? ' vigsy-cognition--compact' : ''}`}
      aria-live="polite"
      aria-label="KayD is thinking"
    >
      <span className="vigsy-cognition__ring vigsy-cognition__ring--outer" aria-hidden="true" />
      <span className="vigsy-cognition__ring vigsy-cognition__ring--inner" aria-hidden="true" />
      <span className="vigsy-cognition__core" aria-hidden="true" />
    </div>
  );
}

export function ThinkingIndicator({ label = 'Thinking' }: { label?: string }) {
  return (
    <div className="vigsy-thinking-row" aria-live="polite" aria-label="KayD is thinking">
      <CognitionPulse compact />
      <span className="vigsy-thinking-row__label">{label}</span>
    </div>
  );
}

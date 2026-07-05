/** Instant KayD guidance lines — no teleprompter delay. */
export function KaydContextWalkthrough({
  lines,
  title = 'Walkthrough',
}: {
  lines: string[];
  title?: string;
}) {
  if (lines.length === 0) return null;

  return (
    <div className="kayd-context-walkthrough" aria-live="polite">
      <p className="kayd-context-walkthrough__label muted">{title}</p>
      <div className="kayd-context-walkthrough__lines">
        {lines.map((line) => (
          <p key={line} className="kayd-context-walkthrough__line">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

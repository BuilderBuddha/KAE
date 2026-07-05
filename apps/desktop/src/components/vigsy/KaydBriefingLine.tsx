/** Plain briefing text — Vigsy teleprompter stream line inside the chat panel. */
export function KaydBriefingLine({
  text,
  streaming = false,
  fading = false,
  multiline = false,
}: {
  text: string;
  streaming?: boolean;
  fading?: boolean;
  multiline?: boolean;
}) {
  return (
    <p
      className={`kayd-briefing-line${streaming ? ' kayd-briefing-line--streaming' : ' kayd-briefing-line--latest'}${fading ? ' kayd-briefing-line--fading' : ''}`}
      style={multiline ? { whiteSpace: 'pre-line' } : undefined}
    >
      {text}
      {streaming ? <span className="kayd-briefing-line__cursor" aria-hidden /> : null}
    </p>
  );
}

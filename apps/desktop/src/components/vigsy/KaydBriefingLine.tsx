/** Plain briefing text â€” no bubble chrome inside the chat panel. */
export function KaydBriefingLine({
  text,
  streaming = false,
}: {
  text: string;
  streaming?: boolean;
}) {
  return (
    <p
      className={`kayd-seq-briefing__text${streaming ? ' kayd-seq-briefing__text--streaming' : ''}`}
    >
      {text}
      {streaming ? <span className="kayd-seq-briefing__cursor" aria-hidden /> : null}
    </p>
  );
}

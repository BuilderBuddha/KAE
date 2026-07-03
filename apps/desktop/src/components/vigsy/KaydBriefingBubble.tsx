/** Assistant briefing line — compact for single-slot chatbot display. */
export function KaydBriefingBubble({
  text,
  streaming = false,
  compact = false,
}: {
  text: string;
  streaming?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`vigsy-msg vigsy-msg--assistant vigsy-msg--enter kayd-seq-briefing__line${streaming ? ' vigsy-msg--alive' : ''}${compact ? ' kayd-briefing-bubble--compact' : ''}`}
    >
      <div className="vigsy-msg__presence kayd-lead__presence" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__content">
        <div
          className={`vigsy-msg__bubble vigsy-msg__bubble--vigsy kayd-lead__bubble${streaming ? ' vigsy-msg__bubble--streaming' : ''}`}
        >
          <p className="vigsy-msg__text">{text}</p>
          {streaming ? <span className="vigsy-cursor" aria-hidden /> : null}
        </div>
      </div>
    </div>
  );
}

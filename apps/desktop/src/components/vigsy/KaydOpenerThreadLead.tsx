/** Opener lines woven into the thread as KayD's executive readiness context. */
export function KaydOpenerThreadLead({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="vigsy-msg vigsy-msg--assistant vigsy-msg--enter vigsy-msg--opener-lead">
      <div className="vigsy-msg__presence" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__content">
        <div className="vigsy-msg__bubble vigsy-msg__bubble--vigsy vigsy-msg__bubble--opener-lead">
          {lines.map((line) => (
            <p key={line} className="vigsy-msg__text">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

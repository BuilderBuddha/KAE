/** Vigsy-style presence row — dot, KayD name, and status subtitle. */
export function KaydPresenceHeader({
  thinking,
  statusLabel,
}: {
  thinking: boolean;
  statusLabel: string;
}) {
  return (
    <header
      className={`kayd-presence-header${thinking ? ' kayd-presence-header--thinking' : ' kayd-presence-header--alive'}`}
    >
      <p className="kayd-presence-header__title">
        <span className="kayd-presence-header__dot" aria-hidden />
        KayD
      </p>
      <p
        className={`kayd-presence-header__status${thinking ? ' kayd-presence-header__status--pulse' : ''}`}
      >
        {statusLabel}
      </p>
    </header>
  );
}

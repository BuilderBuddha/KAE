/** Vigsy-style presence row — dot, optional KayD name, and status subtitle. */
export function KaydPresenceHeader({
  thinking,
  statusLabel,
  showName = true,
}: {
  thinking: boolean;
  statusLabel: string;
  showName?: boolean;
}) {
  return (
    <header
      className={`kayd-presence-header${thinking ? ' kayd-presence-header--thinking' : ' kayd-presence-header--alive'}${showName ? '' : ' kayd-presence-header--status-only'}`}
    >
      <p className="kayd-presence-header__title">
        <span className="kayd-presence-header__dot" aria-hidden />
        {showName ? 'KayD' : statusLabel}
      </p>
      {showName ? (
        <p
          className={`kayd-presence-header__status${thinking ? ' kayd-presence-header__status--pulse' : ''}`}
        >
          {statusLabel}
        </p>
      ) : null}
    </header>
  );
}

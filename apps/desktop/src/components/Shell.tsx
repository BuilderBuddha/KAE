import type { ReactNode } from 'react';
import { Navigation } from './Navigation';
import type { ScreenId } from '../types/navigation';

interface ShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}

export function Shell({ activeScreen, onNavigate, children }: ShellProps) {
  const vigsyFocus = activeScreen === 'vigsy';

  return (
    <div className={`shell${vigsyFocus ? ' shell--vigsy-focus' : ''}`}>
      <aside className={`shell__sidebar${vigsyFocus ? ' shell__sidebar--compact' : ''}`}>
        <header className="shell__brand">
          <div className="shell__logo shell__logo--vigsy">✦</div>
          <div className="shell__brand-text">
            <h1 className="shell__title">Vigsy</h1>
            {!vigsyFocus ? <p className="shell__subtitle">Executive Intelligence</p> : null}
          </div>
        </header>
        <Navigation activeScreen={activeScreen} onNavigate={onNavigate} compact={vigsyFocus} />
      </aside>
      <main className="shell__content shell__content--vigsy">{children}</main>
    </div>
  );
}

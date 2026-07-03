import type { ReactNode } from 'react';
import { Navigation } from './Navigation';
import type { ScreenId } from '../types/navigation';

interface ShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}

export function Shell({ activeScreen, onNavigate, children }: ShellProps) {
  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <header className="shell__brand">
          <div className="shell__logo shell__logo--vigsy">✦</div>
          <div>
            <h1 className="shell__title">Vigsy</h1>
            <p className="shell__subtitle">Executive Intelligence · KAE</p>
          </div>
        </header>
        <Navigation activeScreen={activeScreen} onNavigate={onNavigate} />
        <footer className="shell__footer">
          <span className="shell__phase">Campaign 1.3 · Vigsy Experience</span>
        </footer>
      </aside>
      <main className="shell__content">{children}</main>
    </div>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';

import { Navigation } from './Navigation';

import type { ScreenId } from '../types/navigation';
import { resetWorkspaceScroll } from '../utils/workspace-scroll';

interface ShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}

export function Shell({ activeScreen, onNavigate, children }: ShellProps) {
  const vigsyFocus = activeScreen === 'vigsy';
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const runReset = () => resetWorkspaceScroll(contentRef.current);
    runReset();
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(runReset);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeScreen]);

  return (
    <div className={`shell${vigsyFocus ? ' shell--vigsy-focus' : ''}`}>
      <aside className="shell__sidebar">
        <header className="shell__brand">
          <div className="shell__logo shell__logo--vigsy">✦</div>
          <div className="shell__brand-text">
            <h1 className="shell__title">KayD</h1>
            <p className="shell__subtitle">Knowledge workspace</p>
          </div>
        </header>
        <Navigation activeScreen={activeScreen} onNavigate={onNavigate} />
      </aside>
      <main
        ref={contentRef}
        key={activeScreen}
        className="shell__content shell__content--vigsy workspace-transition"
      >
        {children}
      </main>
    </div>
  );
}

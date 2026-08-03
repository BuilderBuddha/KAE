import { useEffect, useRef, type ReactNode } from 'react';

import { Navigation } from './Navigation';
import { KaydInvestigationDock } from './vigsy/KaydInvestigationDock';
import { useVigsyConversation } from '../context/VigsyConversationContext';

import type { ScreenId } from '../types/navigation';
import { showsInvestigationDock } from '../utils/kayd-workspace';
import { resetWorkspaceScroll } from '../utils/workspace-scroll';

interface ShellProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: ReactNode;
}

export function Shell({ activeScreen, onNavigate, children }: ShellProps) {
  const vigsyFocus = activeScreen === 'vigsy';
  const contentRef = useRef<HTMLElement>(null);
  const { hasConversation } = useVigsyConversation();
  const dockVisible = showsInvestigationDock(activeScreen, hasConversation);

  useEffect(() => {
    const runReset = () => resetWorkspaceScroll(contentRef.current);
    runReset();
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(runReset);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeScreen]);

  return (
    <div className={`shell${vigsyFocus ? ' shell--vigsy-focus' : ''}${dockVisible ? ' shell--investigation-dock' : ''}`}>
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
      <div className="shell__main">
        <main
          ref={contentRef}
          key={activeScreen}
          className={`shell__content shell__content--vigsy workspace-transition${dockVisible ? ' shell__content--with-dock' : ''}`}
        >
          {children}
        </main>
        {dockVisible ? <KaydInvestigationDock activeScreen={activeScreen} /> : null}
      </div>
    </div>
  );
}

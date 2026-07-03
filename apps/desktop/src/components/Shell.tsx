import { useEffect, useRef, type ReactNode } from 'react';

import { Navigation } from './Navigation';

import type { ScreenId } from '../types/navigation';



interface ShellProps {

  activeScreen: ScreenId;

  onNavigate: (screen: ScreenId) => void;

  children: ReactNode;

}



export function Shell({ activeScreen, onNavigate, children }: ShellProps) {

  const vigsyFocus = activeScreen === 'vigsy';

  const contentRef = useRef<HTMLElement>(null);



  useEffect(() => {

    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });

  }, [activeScreen]);



  return (

    <div className={`shell${vigsyFocus ? ' shell--vigsy-focus' : ''}`}>

      <aside className={`shell__sidebar${vigsyFocus ? ' shell__sidebar--compact' : ''}`}>

        <header className="shell__brand">

          <div className="shell__logo shell__logo--vigsy">✦</div>

          <div className="shell__brand-text">

            <h1 className="shell__title">KayD</h1>

            {!vigsyFocus ? <p className="shell__subtitle">KayD Intelligence</p> : null}

          </div>

        </header>

        <Navigation activeScreen={activeScreen} onNavigate={onNavigate} compact={vigsyFocus} />

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



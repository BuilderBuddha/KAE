import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveBriefing, RepositoryHealthReport, RepositoryStats } from '@scooper/core';
import type { ChatGptImportListEntry } from '../../types/kae';
import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';

const SUGGESTED_QUESTIONS = [
  'What happened with ChatGPT Import?',
  'What did we decide about Repository Repair?',
  'Summarize POSCA UX.',
  'Show evidence that videos work.',
  'What are the unresolved blockers in KAE?',
];

interface VigsyHomePanelProps {
  onAsk: (question: string) => void;
  busy: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export function VigsyHomePanel({
  onAsk,
  busy,
  inputValue,
  onInputChange,
  onSubmit,
}: VigsyHomePanelProps) {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [health, setHealth] = useState<RepositoryHealthReport | null>(null);
  const [recent, setRecent] = useState<ChatGptImportListEntry[]>([]);
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const loadContext = useCallback(async () => {
    const [s, h, entries] = await Promise.all([
      window.kae.getRepositoryStats(),
      window.kae.getRepositoryHealth(),
      window.kae.listChatGptImportEntries(),
    ]);
    setStats(s);
    setHealth(h);
    setRecent(entries.slice(0, 5));
  }, []);

  const applyBriefing = useCallback((next: ExecutiveBriefing) => {
    setBriefing(next);
  }, []);

  const refreshBriefingInBackground = useCallback(async () => {
    setBackgroundRefreshing(true);
    try {
      const fresh = await window.kae.refreshExecutiveBriefing();
      applyBriefing(fresh);
    } finally {
      setBackgroundRefreshing(false);
    }
  }, [applyBriefing]);

  const loadBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const result = await window.kae.getExecutiveBriefing();
      applyBriefing(result.briefing);
      if (result.stale) {
        void refreshBriefingInBackground();
      }
    } finally {
      setBriefingLoading(false);
    }
  }, [applyBriefing, refreshBriefingInBackground]);

  const handleManualRefresh = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const [fresh] = await Promise.all([
        window.kae.refreshExecutiveBriefing(),
        loadContext(),
      ]);
      applyBriefing(fresh);
    } finally {
      setBriefingLoading(false);
    }
  }, [applyBriefing, loadContext]);

  useEffect(() => {
    void loadContext();
    void loadBriefing();
  }, [loadContext, loadBriefing]);

  useEffect(() => {
    const unsubscribe = window.kae.onExecutiveBriefingUpdated(() => {
      void window.kae.getExecutiveBriefing().then((result) => {
        applyBriefing(result.briefing);
        if (result.stale) void refreshBriefingInBackground();
      });
    });
    const onImportComplete = window.kae.onImportComplete(() => {
      void loadContext();
      void refreshBriefingInBackground();
    });
    return () => {
      unsubscribe();
      onImportComplete();
    };
  }, [applyBriefing, loadContext, refreshBriefingInBackground]);

  return (
    <div className="vigsy-home vigsy-home--founder">
      <header className="vigsy-home__hero vigsy-home__hero--center">
        <h1 className="vigsy-home__brand">Vigsy</h1>
        <div className="vigsy-home__luminous-line" aria-hidden="true" />
        <p className="vigsy-home__lead">Evidence-grounded executive intelligence</p>
      </header>

      <form
        className="vigsy-home__composer vigsy-home__composer--hero"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="vigsy-composer">
          Ask Vigsy
        </label>
        <textarea
          id="vigsy-composer"
          className="vigsy-home__input vigsy-home__input--hero"
          rows={3}
          placeholder="Ask Vigsy anything about your knowledge…"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={busy}
          autoFocus
        />
        <div className="vigsy-home__composer-actions vigsy-home__composer-actions--center">
          <button type="submit" className="btn btn--primary btn--large" disabled={busy || !inputValue.trim()}>
            {busy ? 'Thinking…' : 'Ask Vigsy'}
          </button>
        </div>
      </form>

      <section className="vigsy-home__suggestions vigsy-home__suggestions--center">
        <div className="vigsy-chips">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="vigsy-chip"
              disabled={busy}
              onClick={() => onAsk(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <details className="vigsy-home__drawer">
        <summary className="vigsy-home__drawer-summary">Executive Briefing</summary>
        <ExecutiveBriefingPanel
          briefing={briefing}
          loading={briefingLoading}
          backgroundRefreshing={backgroundRefreshing}
          onRefresh={() => void handleManualRefresh()}
        />
      </details>

      <details className="vigsy-home__drawer">
        <summary className="vigsy-home__drawer-summary">Repository</summary>
        <div className="vigsy-home__grid">
          <section className="card vigsy-home__card">
            <h3>Health</h3>
            <p className={`vigsy-home__stat-value vigsy-home__stat-value--${health?.statusLevel ?? 'attention'}`}>
              {health?.statusHeadline ?? 'Checking…'}
            </p>
            <p className="muted">{health?.statusSubline}</p>
          </section>
          <section className="card vigsy-home__card">
            <h3>Knowledge</h3>
            <p className="vigsy-home__stat-value">{stats?.sourceCount ?? 0} sources</p>
            <p className="muted">
              {stats?.sessionCount ?? 0} sessions · {stats?.issueCount ?? 0} issues
            </p>
          </section>
          <section className="card vigsy-home__card vigsy-home__card--wide">
            <h3>Recent Activity</h3>
            {recent.length === 0 ? (
              <p className="muted">No recent ChatGPT imports indexed.</p>
            ) : (
              <ul className="vigsy-home__activity">
                {recent.map((entry) => (
                  <li key={entry.relativePath}>
                    <span className="vigsy-home__activity-krc">{entry.krcId}</span>
                    <span>{entry.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </details>
    </div>
  );
}

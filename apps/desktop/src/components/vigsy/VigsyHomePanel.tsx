import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveBriefing, RepositoryHealthReport, RepositoryStats } from '@scooper/core';
import type { ChatGptImportListEntry } from '../../types/kae';
import { LoadingIndicator } from '../LoadingIndicator';
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
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(true);

  const loadBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const result = await window.kae.getExecutiveBriefing();
      setBriefing(result);
    } finally {
      setBriefingLoading(false);
    }
  }, []);

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h, entries] = await Promise.all([
        window.kae.getRepositoryStats(),
        window.kae.getRepositoryHealth(),
        window.kae.listChatGptImportEntries(),
      ]);
      setStats(s);
      setHealth(h);
      setRecent(entries.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadContext(), loadBriefing()]);
  }, [loadBriefing, loadContext]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  return (
    <div className="vigsy-home">
      <header className="vigsy-home__hero">
        <p className="vigsy-home__eyebrow">Executive Intelligence</p>
        <h1 className="vigsy-home__greeting">Hello — I&apos;m Vigsy.</h1>
        <p className="vigsy-home__lead">
          Ask about decisions, conversations, and evidence across your Axiom Knowledge repository.
        </p>
      </header>

      <ExecutiveBriefingPanel
        briefing={briefing}
        loading={briefingLoading}
        onRefresh={() => void refreshAll()}
      />

      {loading ? (
        <LoadingIndicator label="Loading repository context…" />
      ) : (
        <div className="vigsy-home__grid">
          <section className="card vigsy-home__card">
            <h3>Repository Health</h3>
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
      )}

      <section className="vigsy-home__suggestions">
        <h3 className="vigsy-home__suggestions-title">Suggested questions</h3>
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

      <form
        className="vigsy-home__composer card"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="form__label" htmlFor="vigsy-composer">
          Ask Vigsy anything about your knowledge
        </label>
        <textarea
          id="vigsy-composer"
          className="form__input vigsy-home__input"
          rows={3}
          placeholder="What happened with ChatGPT Import?"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={busy}
        />
        <div className="vigsy-home__composer-actions">
          <button type="submit" className="btn btn--primary" disabled={busy || !inputValue.trim()}>
            {busy ? 'Thinking…' : 'Ask Vigsy'}
          </button>
        </div>
      </form>
    </div>
  );
}

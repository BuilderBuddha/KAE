import { useEffect, useState } from 'react';
import type { RepositorySearchResult } from '@scooper/core';
import { useNavigation } from '../context/NavigationContext';

function kindLabel(result: RepositorySearchResult): string {
  if (result.evidenceKind) {
    return result.evidenceKind.replace(/_/g, ' ');
  }
  return result.category;
}

function matchLabel(result: RepositorySearchResult): string {
  if (!result.matchFields?.length) return '';
  return result.matchFields.join(', ');
}

export function SearchScreen() {
  const { openInExplorer } = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RepositorySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStats, setIndexStats] = useState<string | null>(null);
  const [selected, setSelected] = useState<RepositorySearchResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const warmIndex = async () => {
      setIndexing(true);
      try {
        const stats = await window.kae.buildEvidenceIndex();
        if (!cancelled) {
          setIndexStats(
            `${stats.recordCount} records · ${stats.messages} messages · ${stats.attachments} attachments`,
          );
        }
      } catch {
        if (!cancelled) setIndexStats('Index build failed');
      } finally {
        if (!cancelled) setIndexing(false);
      }
    };
    void warmIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const hits = await window.kae.searchKnowledge(query.trim());
      setResults(hits);
      setSelected(null);
      setPreview(null);
    } finally {
      setSearching(false);
    }
  };

  const openResult = async (result: RepositorySearchResult) => {
    setSelected(result);
    const content = await window.kae.readRepositoryFile(result.path);
    setPreview(content);
  };

  const drillIntoExplorer = (result: RepositorySearchResult) => {
    openInExplorer(result.path);
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Knowledge Search</h2>
        <p className="screen__description">
          Evidence-indexed search across sources, conversations, messages, attachments, and executive
          sessions.
        </p>
        {indexStats ? (
          <p className="screen__description muted">
            {indexing ? 'Building evidence index…' : `Evidence index: ${indexStats}`}
          </p>
        ) : null}
      </header>

      <div className="search-bar">
        <input
          type="search"
          className="form__input search-bar__input"
          placeholder="Search by keyword, KRC, title, prompt, response, or filename…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <button type="button" className="btn btn--primary" onClick={runSearch} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="explorer-layout">
        <ul className="explorer-list card">
          {results.length === 0 ? (
            <li className="muted explorer-list__empty">
              {query ? 'No results.' : 'Enter a query to search the evidence index.'}
            </li>
          ) : (
            results.map((result) => (
              <li key={`${result.recordId ?? result.path}-${result.title}`}>
                <button
                  type="button"
                  className={`explorer-list__item${selected?.path === result.path && selected?.recordId === result.recordId ? ' explorer-list__item--active' : ''}`}
                  onClick={() => openResult(result)}
                >
                  <span className="explorer-list__name">{result.title}</span>
                  <span className="explorer-list__meta">
                    {kindLabel(result)}
                    {result.krcId ? ` · ${result.krcId}` : ''}
                    {result.messageRole ? ` · ${result.messageRole}` : ''}
                    {' · score '}
                    {result.score}
                  </span>
                  {matchLabel(result) ? (
                    <span className="explorer-list__meta">Matched: {matchLabel(result)}</span>
                  ) : null}
                  <span className="explorer-list__snippet">{result.snippet}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="card explorer-preview">
          {selected ? (
            <>
              <div className="explorer-preview__actions" style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => drillIntoExplorer(selected)}
                >
                  Open in Explorer
                </button>
              </div>
              {preview ? (
                <pre className="explorer-preview__content">
                  {preview.slice(0, 12000)}
                  {preview.length > 12000 ? '\n\n… (truncated)' : ''}
                </pre>
              ) : (
                <p className="muted">Loading preview…</p>
              )}
            </>
          ) : (
            <p className="muted">Select a result to preview or open in Explorer.</p>
          )}
        </div>
      </div>
    </div>
  );
}

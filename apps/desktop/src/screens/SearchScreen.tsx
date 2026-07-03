import { useState } from 'react';
import type { RepositorySearchResult } from '@scooper/core';

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RepositorySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const hits = await window.kae.searchRepository(query.trim());
      setResults(hits);
      setSelected(null);
      setPreview(null);
    } finally {
      setSearching(false);
    }
  };

  const openResult = async (path: string) => {
    setSelected(path);
    const content = await window.kae.readRepositoryFile(path);
    setPreview(content);
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Knowledge Search</h2>
        <p className="screen__description">
          Search across imported knowledge. Designed to support every connector as KAE grows.
        </p>
      </header>

      <div className="search-bar">
        <input
          type="search"
          className="form__input search-bar__input"
          placeholder="Search knowledge…"
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
              {query ? 'No results.' : 'Enter a query to search the repository.'}
            </li>
          ) : (
            results.map((result) => (
              <li key={result.path}>
                <button
                  type="button"
                  className={`explorer-list__item${selected === result.path ? ' explorer-list__item--active' : ''}`}
                  onClick={() => openResult(result.path)}
                >
                  <span className="explorer-list__name">{result.title}</span>
                  <span className="explorer-list__meta">{result.category} · score {result.score}</span>
                  <span className="explorer-list__snippet">{result.snippet}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="card explorer-preview">
          {preview ? (
            <pre className="explorer-preview__content">{preview.slice(0, 12000)}{preview.length > 12000 ? '\n\n… (truncated)' : ''}</pre>
          ) : (
            <p className="muted">Select a result to preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}

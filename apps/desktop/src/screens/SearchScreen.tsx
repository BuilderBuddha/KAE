import { useEffect, useMemo, useState } from 'react';
import type { EvidenceDrilldown, RepositorySearchResult } from '@scooper/core';
import { EvidenceDrilldownPanel } from '../components/EvidenceDrilldownPanel';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { useNavigation } from '../context/NavigationContext';
import { useVigsyConversation } from '../context/VigsyConversationContext';
import { buildKaydSearchBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';

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
  const { navigate } = useNavigation();
  const { submitQuestion, activeInvestigation, busy } = useVigsyConversation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RepositorySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStats, setIndexStats] = useState<string | null>(null);
  const [selected, setSelected] = useState<RepositorySearchResult | null>(null);
  const [drilldown, setDrilldown] = useState<EvidenceDrilldown | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    if (activeInvestigation?.searchQuery) {
      setQuery(activeInvestigation.searchQuery);
    }
  }, [activeInvestigation?.searchQuery]);

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

  const syncLocalResults = async (searchQuery: string) => {
    setSearching(true);
    try {
      const hits = await window.kae.searchKnowledge(searchQuery);
      setResults(hits);
      setSelected(null);
      setDrilldown(null);
    } finally {
      setSearching(false);
    }
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q || busy) return;
    navigate('vigsy');
    await submitQuestion(q);
  };

  const openResult = async (result: RepositorySearchResult) => {
    setSelected(result);
    if (!result.recordId) {
      setDrilldown(null);
      return;
    }

    setDrilldownLoading(true);
    try {
      const chain = await window.kae.resolveEvidenceDrilldown(result.recordId, query.trim() || undefined);
      setDrilldown(chain);
    } catch {
      setDrilldown(null);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const indexSummary = useMemo(() => {
    if (!indexStats) return null;
    if (indexStats === 'Index build failed') return null;
    return indexStats.replace(/^Evidence index:\s*/, '');
  }, [indexStats]);

  const searchBriefing = useMemo(() => buildKaydSearchBriefing(indexSummary), [indexSummary]);

  return (
    <KaydWorkspaceLayout
      workspaceScreen="search"
      workspaceClassName="screen--search"
      briefing={searchBriefing}
      composerId={KAYD_WORKSPACE_COMPOSER_ID}
      briefingStatus={KAYD_BRIEFING_STATUS.search}
    >
      <section className="screen-evidence" aria-label="Search results">
        <header className="screen-evidence__header">
          <h3 className="screen-evidence__title">Supporting evidence</h3>
          {indexStats ? (
            <p className="screen-evidence__meta muted">
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
            onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
          />
          <button type="button" className="btn btn--primary" onClick={() => void runSearch()} disabled={searching || busy}>
            {searching ? 'Searching…' : 'Ask KayD'}
          </button>
        </div>

        <div className="explorer-layout">
          <ul className="explorer-list card">
            {results.length === 0 ? (
              <li className="muted explorer-list__empty">
                {query ? 'No results.' : 'Enter a query — KayD will answer and results appear here.'}
              </li>
            ) : (
              results.map((result) => (
                <li key={`${result.recordId ?? result.path}-${result.title}`}>
                  <button
                    type="button"
                    className={`explorer-list__item${selected?.recordId === result.recordId ? ' explorer-list__item--active' : ''}`}
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
          <div className="card explorer-preview evidence-drilldown-panel">
            {!selected ? (
              <p className="muted">Select a result to explore the evidence chain.</p>
            ) : drilldownLoading ? (
              <p className="muted">Resolving evidence chain…</p>
            ) : drilldown ? (
              <EvidenceDrilldownPanel drilldown={drilldown} />
            ) : (
              <p className="muted">Unable to resolve evidence drilldown for this result.</p>
            )}
          </div>
        </div>
      </section>
    </KaydWorkspaceLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RepositoryFileEntry } from '@scooper/core';
import { isChatGptImportSourceFileName } from '../utils/chatgpt-import';
import {
  ensurePinnedEntryVisible,
  filterChatGptImportEntries,
  filterForOpenedPath,
  filterRepositoryEntries,
  investigationSuggestsChatGptImport,
  resolveExplorerFilenameSearch,
  repoPathsEqual,
} from '../utils/explorer-browse';
import { ChatGptSourcePreview } from '../components/ChatGptSourcePreview';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useNavigation } from '../context/NavigationContext';
import { useInvestigationSync } from '../hooks/useInvestigationSync';
import { KaydCapabilityImages } from '../components/vigsy/capabilities/KaydCapabilityImages';
import { KaydCapabilityTimeline } from '../components/vigsy/capabilities/KaydCapabilityTimeline';
import { useVigsyConversation } from '../context/VigsyConversationContext';
import { investigationViewFromLens } from '../utils/investigation-workflow';
import { buildKaydExplorerBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';
import { parentFolder, pathBreadcrumbs } from '../utils/repository-path';
import type { ChatGptImportListEntry, ChatGptSourcePreviewData } from '../types/kae';

const CATEGORY_LABELS: Record<RepositoryFileEntry['category'], string> = {
  sources: 'Knowledge / Sources',
  sessions: 'Executive Sessions',
  registries: 'Registries',
  reports: 'Import Reports',
  uploads: 'Uploads',
  other: 'Other',
};

function formatBytes(bytes?: number): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatListDate(entry: ChatGptImportListEntry): string {
  const label = entry.updateTime ? 'Updated' : 'Created';
  const value = entry.updateTime ?? entry.createTime;
  if (!value) return '—';
  return `${label} ${formatDate(value)}`;
}

export function ExplorerScreen() {
  const { explorerTargetPath, clearExplorerTarget } = useNavigation();
  const { investigationActive, investigationLens, latestInvestigationAnswer, activeInvestigation, selectedEvidencePath, setSelectedEvidencePath } =
    useVigsyConversation();
  const lensView = investigationViewFromLens(investigationLens);
  const [files, setFiles] = useState<RepositoryFileEntry[]>([]);
  const [chatGptEntries, setChatGptEntries] = useState<ChatGptImportListEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false);
  /** User-typed filename filter only — never auto-filled from investigation topic. */
  const [userSearch, setUserSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [pinnedPath, setPinnedPath] = useState<string | null>(null);
  const [targetUnavailable, setTargetUnavailable] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [chatGptPreview, setChatGptPreview] = useState<ChatGptSourcePreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const chatGptImportCount = chatGptEntries.length;
  const filenameSearch = resolveExplorerFilenameSearch({
    userEnteredSearch: userSearch,
    investigationSearchQuery: activeInvestigation?.searchQuery,
  });

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setActionMsg(null);
    try {
      const [entries, importEntries] = await Promise.all([
        window.kae.browseRepository(),
        window.kae.listChatGptImportEntries(),
      ]);
      setFiles(entries);
      setChatGptEntries(importEntries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useInvestigationSync((ctx) => {
    // Structured investigation context: category / lens — not a filename substring.
    if (investigationSuggestsChatGptImport(ctx.searchQuery) || investigationSuggestsChatGptImport(ctx.topic)) {
      setFilter('chatgpt-import');
    }
    void loadFiles();
  });

  useEffect(() => {
    if (loading || defaultFilterApplied) return;
    if (chatGptImportCount > 0 && !pinnedPath) {
      setFilter('chatgpt-import');
    }
    setDefaultFilterApplied(true);
  }, [loading, chatGptImportCount, defaultFilterApplied, pinnedPath]);

  const showChatGptImport = filter === 'chatgpt-import';

  const openFile = useCallback(async (relativePath: string) => {
    setSelected(relativePath);
    setSelectedEvidencePath(relativePath);
    setTargetUnavailable(false);
    setPreviewLoading(true);
    setPreview(null);
    setChatGptPreview(null);
    try {
      const fileName = relativePath.split(/[/\\]/).pop() ?? '';
      if (isChatGptImportSourceFileName(fileName)) {
        const data = await window.kae.parseChatGptSource(relativePath);
        if (data) {
          setChatGptPreview(data);
          return;
        }
      }
      const content = await window.kae.readRepositoryFile(relativePath);
      setPreview(content);
    } catch {
      setPreview('Unable to load file preview.');
    } finally {
      setPreviewLoading(false);
    }
  }, [setSelectedEvidencePath]);

  // Capture open-in-Explorer target without treating investigation text as a search.
  useEffect(() => {
    if (!explorerTargetPath) return;
    const path = explorerTargetPath;
    clearExplorerTarget();
    setPinnedPath(path);
    setSelectedEvidencePath(path);
    setUserSearch('');
    setFilter(filterForOpenedPath(path));
    setTargetUnavailable(false);
  }, [explorerTargetPath, clearExplorerTarget, setSelectedEvidencePath]);

  // Restore investigation evidence selection after screen remount.
  useEffect(() => {
    if (pinnedPath || loading) return;
    if (!selectedEvidencePath) return;
    if (selected && repoPathsEqual(selected, selectedEvidencePath)) return;
    const inChat = chatGptEntries.some((entry) => repoPathsEqual(entry.relativePath, selectedEvidencePath));
    const inFiles = files.some((file) => repoPathsEqual(file.relativePath, selectedEvidencePath));
    if (inChat || inFiles) {
      setPinnedPath(selectedEvidencePath);
    }
  }, [selectedEvidencePath, pinnedPath, loading, selected, chatGptEntries, files]);

  // Resolve pin against loaded catalog: select + preview, or honest unavailable.
  useEffect(() => {
    if (!pinnedPath || loading) return;
    const inChat = chatGptEntries.some((entry) => repoPathsEqual(entry.relativePath, pinnedPath));
    const inFiles = files.some((file) => repoPathsEqual(file.relativePath, pinnedPath));
    if (!inChat && !inFiles) {
      setTargetUnavailable(true);
      setSelected(pinnedPath);
      setPreview(null);
      setChatGptPreview(null);
      setPreviewLoading(false);
      return;
    }
    void openFile(pinnedPath);
  }, [pinnedPath, loading, files, chatGptEntries, openFile]);

  const filtered = useMemo(() => {
    if (filter === 'chatgpt-import') {
      const base = filterChatGptImportEntries(chatGptEntries, filenameSearch);
      const ensured = ensurePinnedEntryVisible(base, chatGptEntries, pinnedPath);
      return ensured.list;
    }

    const base = filterRepositoryEntries(files, filter, filenameSearch);
    const ensured = ensurePinnedEntryVisible(base, files, pinnedPath);
    return ensured.list;
  }, [files, chatGptEntries, filter, filenameSearch, pinnedPath]);

  const selectedFile = files.find((f) => selected != null && repoPathsEqual(f.relativePath, selected));
  const selectedChatGpt = chatGptEntries.find(
    (entry) => selected != null && repoPathsEqual(entry.relativePath, selected),
  );
  const selectedEntry = showChatGptImport ? selectedChatGpt : selectedFile;

  const handleOpen = async () => {
    if (!selected || targetUnavailable) return;
    await window.kae.openRepositoryFile(selected);
  };

  const handleReveal = async () => {
    if (!selected || targetUnavailable) return;
    await window.kae.revealRepositoryFile(selected);
  };

  const handleCopyPath = async () => {
    if (!selected) return;
    await window.kae.copyText(selected);
    setActionMsg('Path copied to clipboard.');
  };

  const groupedFiles = useMemo(() => {
    if (showChatGptImport) return null;
    const list = filtered as RepositoryFileEntry[];
    const groups = new Map<string, RepositoryFileEntry[]>();
    for (const file of list) {
      const folder = parentFolder(file.relativePath);
      const bucket = groups.get(folder) ?? [];
      bucket.push(file);
      groups.set(folder, bucket);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, showChatGptImport]);

  const selectedBreadcrumbs = selected ? pathBreadcrumbs(selected) : [];

  const explorerBriefing = useMemo(
    () => buildKaydExplorerBriefing(files.length, chatGptImportCount),
    [files.length, chatGptImportCount],
  );

  const showEmptyState = !loading && filtered.length === 0 && !targetUnavailable;

  return (
    <KaydWorkspaceLayout
      workspaceScreen="explorer"
      workspaceClassName="screen--explorer"
      briefing={explorerBriefing}
      composerId={KAYD_WORKSPACE_COMPOSER_ID}
      briefingStatus={KAYD_BRIEFING_STATUS.explorer}
    >

      <section className="screen-evidence" aria-label="Repository files">
        {!investigationActive ? (
          <header className="screen-evidence__header">
            <h3 className="screen-evidence__title">Supporting evidence</h3>
            <p className="screen-evidence__lead muted">Files, sources, and previews.</p>
          </header>
        ) : null}

        {investigationActive && lensView === 'timeline' && latestInvestigationAnswer ? (
          <section className="kayd-capability-native" aria-label="Timeline">
            <h3 className="kayd-capability-native__title">Timeline</h3>
            <KaydCapabilityTimeline answer={latestInvestigationAnswer} />
          </section>
        ) : null}

        {investigationActive && lensView === 'images' && latestInvestigationAnswer ? (
          <section className="kayd-capability-native" aria-label="Images">
            <h3 className="kayd-capability-native__title">Images</h3>
            <KaydCapabilityImages answer={latestInvestigationAnswer} />
          </section>
        ) : null}

        {investigationActive && activeInvestigation && lensView !== 'timeline' && lensView !== 'images' ? (
          <header className="screen-evidence__header screen-evidence__header--compact">
            <h3 className="screen-evidence__title">Repository</h3>
            <p className="screen-evidence__meta muted">
              Active investigation: &ldquo;{activeInvestigation.topic}&rdquo;
              {showChatGptImport
                ? ` · ${filtered.length} ChatGPT Import record(s)`
                : ` · ${filtered.length} visible record(s)`}
              {filenameSearch ? ` · filtered by “${filenameSearch}”` : null}
            </p>
          </header>
        ) : null}

        {(!investigationActive || (lensView !== 'timeline' && lensView !== 'images')) && (
          <>
        {chatGptImportCount > 0 && (
          <div className="explorer-view-switch" role="tablist" aria-label="Explorer view">
            <button
              type="button"
              role="tab"
              aria-selected={showChatGptImport}
              className={`btn ${showChatGptImport ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setFilter('chatgpt-import')}
            >
              ChatGPT Import ({chatGptImportCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!showChatGptImport}
              className={`btn ${!showChatGptImport ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setFilter('all')}
            >
              All repository files
            </button>
          </div>
        )}

      {selectedBreadcrumbs.length > 0 ? (
        <nav className="explorer-breadcrumbs" aria-label="Breadcrumb">
          {selectedBreadcrumbs.map((segment, index) => (
            <span key={`${segment}-${index}`} className="explorer-breadcrumbs__segment">
              {index > 0 ? <span className="explorer-breadcrumbs__sep">/</span> : null}
              <span>{segment}</span>
            </span>
          ))}
        </nav>
      ) : null}

      <div className="explorer-toolbar">
        <input
          type="search"
          className="form__input explorer-search"
          placeholder="Filter files…"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        <select className="form__input explorer-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All categories</option>
          {chatGptImportCount > 0 && (
            <option value="chatgpt-import">ChatGPT Import ({chatGptImportCount})</option>
          )}
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--secondary" onClick={() => void loadFiles()} disabled={loading}>
          Refresh
        </button>
      </div>

      {actionMsg && <p className="explorer-action-msg muted">{actionMsg}</p>}

      {targetUnavailable && pinnedPath ? (
        <section className="card empty-state" role="status">
          <p className="empty-state__title">Source unavailable</p>
          <p className="empty-state__hint">
            No repository record was found for <code>{pinnedPath}</code>. The path may have moved or is not
            registered.
          </p>
        </section>
      ) : null}

      {loading ? (
        <LoadingIndicator label="Loading repository…" />
      ) : showEmptyState ? (
        <section className="card empty-state">
          <p className="empty-state__title">No files found</p>
          <p className="empty-state__hint">
            {files.length === 0 && chatGptImportCount === 0
              ? 'The repository is empty or not configured. Import knowledge to populate it.'
              : filenameSearch
                ? 'No files match your filter. Try a different category or search term.'
                : 'No files match the selected category.'}
          </p>
        </section>
      ) : filtered.length > 0 ? (
        <div className="explorer-layout">
          <ul className="explorer-list card">
            {showChatGptImport
              ? (filtered as ChatGptImportListEntry[]).map((entry) => (
                  <li key={entry.relativePath}>
                    <button
                      type="button"
                      className={`explorer-list__item${selected != null && repoPathsEqual(selected, entry.relativePath) ? ' explorer-list__item--active' : ''}`}
                      onClick={() => {
                        setPinnedPath(entry.relativePath);
                        void openFile(entry.relativePath);
                      }}
                    >
                      <span className="explorer-list__name">{entry.krcId} — {entry.title}</span>
                      <span className="explorer-list__meta">{formatListDate(entry)}</span>
                    </button>
                  </li>
                ))
              : groupedFiles?.map(([folder, folderFiles]) => (
                  <li key={folder} className="explorer-folder-group">
                    <p className="explorer-folder-group__label">{folder}</p>
                    <ul className="explorer-folder-group__list">
                      {folderFiles.map((file) => (
                        <li key={file.relativePath}>
                          <button
                            type="button"
                            className={`explorer-list__item${selected != null && repoPathsEqual(selected, file.relativePath) ? ' explorer-list__item--active' : ''}`}
                            onClick={() => {
                              setPinnedPath(file.relativePath);
                              void openFile(file.relativePath);
                            }}
                          >
                            <span className="explorer-list__name">{file.name}</span>
                            <span className="explorer-list__meta">
                              {CATEGORY_LABELS[file.category]} · {formatDate(file.modifiedAt)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
          </ul>

          <div className="card explorer-preview-panel">
            {selectedEntry && (
              <div className="explorer-meta">
                <h3 className="explorer-meta__title">
                  {selectedChatGpt
                    ? `${selectedChatGpt.krcId} — ${selectedChatGpt.title}`
                    : selectedFile?.name}
                </h3>
                <dl className="explorer-meta__stats">
                  <div>
                    <dt>Category</dt>
                    <dd>
                      {selectedChatGpt || (selectedFile && isChatGptImportSourceFileName(selectedFile.name))
                        ? 'ChatGPT Import'
                        : selectedFile
                          ? CATEGORY_LABELS[selectedFile.category]
                          : '—'}
                    </dd>
                  </div>
                  {(selectedChatGpt?.sizeBytes ?? selectedFile?.sizeBytes) != null && (
                    <div>
                      <dt>Size</dt>
                      <dd>{formatBytes(selectedChatGpt?.sizeBytes ?? selectedFile?.sizeBytes)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{selectedChatGpt ? 'Conversation updated' : 'Modified'}</dt>
                    <dd>
                      {selectedChatGpt
                        ? formatDate(selectedChatGpt.updateTime ?? selectedChatGpt.createTime)
                        : formatDate(selectedFile?.modifiedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt>Path</dt>
                    <dd>
                      <code>{selectedEntry.relativePath}</code>
                    </dd>
                  </div>
                </dl>
                <div className="form__actions explorer-meta__actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void handleOpen()}>
                    Open
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void handleReveal()}>
                    Reveal in Folder
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void handleCopyPath()}>
                    Copy Path
                  </button>
                </div>
              </div>
            )}

            <div className="explorer-preview">
              {previewLoading ? (
                <LoadingIndicator label="Loading preview…" />
              ) : chatGptPreview ? (
                <ChatGptSourcePreview data={chatGptPreview} />
              ) : preview ? (
                <pre className="explorer-preview__content">{preview}</pre>
              ) : (
                <p className="muted explorer-preview__empty">Select a file to preview its contents.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
          </>
        )}
      </section>
    </KaydWorkspaceLayout>
  );
}

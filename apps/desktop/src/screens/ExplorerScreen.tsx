import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RepositoryFileEntry } from '@scooper/core';
import { isChatGptImportSourceFileName } from '../utils/chatgpt-import';
import { ChatGptSourcePreview } from '../components/ChatGptSourcePreview';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useNavigation } from '../context/NavigationContext';
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
  const [files, setFiles] = useState<RepositoryFileEntry[]>([]);
  const [chatGptEntries, setChatGptEntries] = useState<ChatGptImportListEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chatGptPreview, setChatGptPreview] = useState<ChatGptSourcePreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const chatGptImportCount = chatGptEntries.length;

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

  useEffect(() => {
    if (loading || defaultFilterApplied) return;
    if (chatGptImportCount > 0) {
      setFilter('chatgpt-import');
    }
    setDefaultFilterApplied(true);
  }, [loading, chatGptImportCount, defaultFilterApplied]);

  const showChatGptImport = filter === 'chatgpt-import';

  const openFile = useCallback(async (relativePath: string) => {
    setSelected(relativePath);
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
  }, []);

  useEffect(() => {
    if (explorerTargetPath) {
      openFile(explorerTargetPath);
      clearExplorerTarget();
    }
  }, [explorerTargetPath, openFile, clearExplorerTarget]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (filter === 'chatgpt-import') {
      const list = chatGptEntries;
      if (!q) return list;
      return list.filter(
        (entry) =>
          entry.relativePath.toLowerCase().includes(q) ||
          entry.name.toLowerCase().includes(q) ||
          entry.title.toLowerCase().includes(q) ||
          entry.krcId.toLowerCase().includes(q),
      );
    }

    return files.filter((f) => {
      if (filter !== 'all' && f.category !== filter) return false;
      if (!q) return true;
      return f.relativePath.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
    });
  }, [files, chatGptEntries, filter, search]);

  const selectedFile = files.find((f) => f.relativePath === selected);
  const selectedChatGpt = chatGptEntries.find((entry) => entry.relativePath === selected);
  const selectedEntry = showChatGptImport ? selectedChatGpt : selectedFile;

  const handleOpen = async () => {
    if (!selected) return;
    await window.kae.openRepositoryFile(selected);
  };

  const handleReveal = async () => {
    if (!selected) return;
    await window.kae.revealRepositoryFile(selected);
  };

  const handleCopyPath = async () => {
    if (!selected) return;
    await window.kae.copyText(selected);
    setActionMsg('Path copied to clipboard.');
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Repository Explorer</h2>
        <p className="screen__description">
          Browse knowledge, sources, executive sessions, registries, and import reports.
        </p>
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
      </header>

      <div className="explorer-toolbar">
        <input
          type="search"
          className="form__input explorer-search"
          placeholder="Filter files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <button type="button" className="btn btn--secondary" onClick={loadFiles} disabled={loading}>
          Refresh
        </button>
      </div>

      {actionMsg && <p className="explorer-action-msg muted">{actionMsg}</p>}

      {loading ? (
        <LoadingIndicator label="Loading repository…" />
      ) : filtered.length === 0 ? (
        <section className="card empty-state">
          <p className="empty-state__title">No files found</p>
          <p className="empty-state__hint">
            {files.length === 0
              ? 'The repository is empty or not configured. Import knowledge to populate it.'
              : 'No files match your filter. Try a different category or search term.'}
          </p>
        </section>
      ) : (
        <div className="explorer-layout">
          <ul className="explorer-list card">
            {showChatGptImport
              ? (filtered as ChatGptImportListEntry[]).map((entry) => (
                  <li key={entry.relativePath}>
                    <button
                      type="button"
                      className={`explorer-list__item${selected === entry.relativePath ? ' explorer-list__item--active' : ''}`}
                      onClick={() => openFile(entry.relativePath)}
                    >
                      <span className="explorer-list__name">{entry.krcId} — {entry.title}</span>
                      <span className="explorer-list__meta">{formatListDate(entry)}</span>
                    </button>
                  </li>
                ))
              : (filtered as RepositoryFileEntry[]).map((file) => (
                  <li key={file.relativePath}>
                    <button
                      type="button"
                      className={`explorer-list__item${selected === file.relativePath ? ' explorer-list__item--active' : ''}`}
                      onClick={() => openFile(file.relativePath)}
                    >
                      <span className="explorer-list__name">{file.name}</span>
                      <span className="explorer-list__meta">{CATEGORY_LABELS[file.category]}</span>
                    </button>
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
                  <button type="button" className="btn btn--secondary btn--sm" onClick={handleOpen}>
                    Open
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={handleReveal}>
                    Reveal in Folder
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={handleCopyPath}>
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
      )}
    </div>
  );
}

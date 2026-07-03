import { useState } from 'react';
import type { ConnectorConfig, ConnectorStatus, SyncHistoryEntry } from '@scooper/core';
import type { ImportSourceDisplay } from '../../utils/import-source-display';

function formatTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

interface KnowledgeSourceDetailProps {
  source: ImportSourceDisplay;
  status?: ConnectorStatus;
  history: SyncHistoryEntry[];
  busy: boolean;
  onRefresh: () => void;
}

export function KnowledgeSourceDetail({
  source,
  status,
  history,
  busy,
  onRefresh,
}: KnowledgeSourceDetailProps) {
  const [error, setError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [draftSettings, setDraftSettings] = useState<Record<string, unknown>>({});

  const sourceHistory = history.filter((entry) => entry.connectorId === source.id).slice(0, 5);

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConnect = () => {
    if (!status) return;
    void run(() => window.kae.connectConnector(status.connectorId, status.config));
  };

  const handleDisconnect = () => {
    void run(() => window.kae.disconnectConnector(source.id));
  };

  const handleSync = async () => {
    if (!status) return;
    let sourcePath: string | null = null;
    if (status.connectorId === 'chatgpt-export-zip') {
      sourcePath = await window.kae.selectZipFile();
    } else if (status.connectorId === 'local-folder') {
      sourcePath = await window.kae.selectFolder();
    }
    void run(() => window.kae.syncConnector(status.connectorId, sourcePath));
  };

  const openConfigure = () => {
    if (!status) return;
    setDraftSettings({ ...status.config.settings });
    setConfiguring(true);
  };

  const saveConfigure = async () => {
    if (!status) return;
    const nextConfig: Partial<ConnectorConfig> = {
      settings: draftSettings,
      scheduledSyncEnabled: Boolean(draftSettings.scheduledSyncEnabled),
      scheduleIntervalMinutes: Number(draftSettings.scheduleIntervalMinutes ?? 60),
    };
    await run(() => window.kae.updateConnectorConfig(status.connectorId, nextConfig));
    setConfiguring(false);
  };

  if (source.uiOnly) {
    return (
      <section className="card knowledge-source-detail">
        <h3 className="knowledge-source-detail__title">{source.label}</h3>
        <p className="muted">This knowledge source is on the roadmap. KayD will connect it when it is ready.</p>
      </section>
    );
  }

  if (!status) {
    return (
      <section className="card knowledge-source-detail">
        <h3 className="knowledge-source-detail__title">{source.label}</h3>
        <p className="muted">Loading source status…</p>
      </section>
    );
  }

  const isStub = status.implementationStatus === 'stub';

  return (
    <section className="card knowledge-source-detail">
      <header className="knowledge-source-detail__header">
        <div>
          <h3 className="knowledge-source-detail__title">{source.label}</h3>
          <p className="knowledge-source-detail__description muted">{source.description}</p>
        </div>
        <span className={`badge badge--${isStub ? 'stub' : 'ready'}`}>
          {status.config.connected ? 'Connected' : isStub ? 'Coming soon' : 'Ready'}
        </span>
      </header>

      {error ? <p className="form__error">{error}</p> : null}

      <dl className="knowledge-source-detail__stats">
        <div>
          <dt>Health</dt>
          <dd>{status.health.status}</dd>
        </div>
        <div>
          <dt>Last sync</dt>
          <dd>{formatTime(status.lastSyncAt)}</dd>
        </div>
        <div>
          <dt>Items imported</dt>
          <dd>{status.itemsImported}</dd>
        </div>
        <div>
          <dt>Monitoring</dt>
          <dd>{status.monitoring.active ? 'Active' : 'Inactive'}</dd>
        </div>
      </dl>

      <div className="form__actions knowledge-source-detail__actions">
        {!status.config.connected ? (
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy || isStub}
            onClick={handleConnect}
          >
            Connect
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleDisconnect}>
            Disconnect
          </button>
        )}
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={openConfigure}>
          Configure
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !status.config.connected || isStub}
          onClick={() => void handleSync()}
        >
          Sync now
        </button>
      </div>

      {configuring ? (
        <div className="knowledge-source-detail__configure form">
          {status.connectorId === 'youtube' ? (
            <>
              <div className="form__group">
                <label htmlFor="youtube-url">YouTube URL</label>
                <input
                  id="youtube-url"
                  value={String(draftSettings.targetUrl ?? '')}
                  onChange={(e) => setDraftSettings({ ...draftSettings, targetUrl: e.target.value })}
                  placeholder="Video, playlist, or channel URL"
                />
              </div>
              <div className="form__group">
                <label htmlFor="youtube-max">Max videos</label>
                <input
                  id="youtube-max"
                  type="number"
                  min={1}
                  max={25}
                  value={Number(draftSettings.maxVideos ?? 5)}
                  onChange={(e) => setDraftSettings({ ...draftSettings, maxVideos: Number(e.target.value) })}
                />
              </div>
            </>
          ) : null}
          {status.connectorId === 'github' ? (
            <>
              <div className="form__group">
                <label htmlFor="github-repo">Repository (owner/repo)</label>
                <input
                  id="github-repo"
                  value={String(draftSettings.repository ?? '')}
                  onChange={(e) => setDraftSettings({ ...draftSettings, repository: e.target.value })}
                  placeholder="octocat/Hello-World"
                />
              </div>
              <div className="form__group">
                <label htmlFor="github-token">API token (optional)</label>
                <input
                  id="github-token"
                  type="password"
                  value={String(draftSettings.apiKey ?? '')}
                  onChange={(e) => setDraftSettings({ ...draftSettings, apiKey: e.target.value })}
                />
              </div>
            </>
          ) : null}
          {status.connectorId === 'local-folder' ? (
            <div className="form__group">
              <label htmlFor="folder-path">Folder path</label>
              <input
                id="folder-path"
                value={String(draftSettings.folderPath ?? '')}
                onChange={(e) => setDraftSettings({ ...draftSettings, folderPath: e.target.value })}
                placeholder="C:\path\to\folder"
              />
            </div>
          ) : null}
          <div className="form__group">
            <label>
              <input
                type="checkbox"
                checked={Boolean(draftSettings.scheduledSyncEnabled)}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, scheduledSyncEnabled: e.target.checked })
                }
              />{' '}
              Scheduled sync
            </label>
          </div>
          <div className="form__group">
            <label htmlFor="schedule-interval">Interval (minutes)</label>
            <input
              id="schedule-interval"
              type="number"
              min={15}
              value={Number(draftSettings.scheduleIntervalMinutes ?? 60)}
              onChange={(e) =>
                setDraftSettings({ ...draftSettings, scheduleIntervalMinutes: Number(e.target.value) })
              }
            />
          </div>
          <div className="form__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setConfiguring(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={saveConfigure}>
              Save
            </button>
          </div>
        </div>
      ) : null}

      <div className="knowledge-source-detail__history">
        <h4 className="screen__section-title">Recent sync history</h4>
        {sourceHistory.length === 0 ? (
          <p className="muted">No sync history for this source yet.</p>
        ) : (
          <ul className="knowledge-source-detail__history-list">
            {sourceHistory.map((entry) => (
              <li key={entry.syncId}>
                <span>{formatTime(entry.completedAt)}</span>
                <span>
                  {entry.itemsImported} imported · {entry.itemsUpdated} updated ·{' '}
                  {entry.success ? 'PASS' : entry.error ?? 'FAIL'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConnectorConfig,
  ConnectorEvent,
  ConnectorStatus,
  SyncHistoryEntry,
} from '@scooper/core';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useNavigation } from '../context/NavigationContext';
import { buildKaydConnectorsBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';

function formatTime(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function healthClass(status: ConnectorStatus['health']['status']): string {
  switch (status) {
    case 'healthy':
      return 'dashboard-status--ready';
    case 'degraded':
      return 'dashboard-status--attention';
    case 'disconnected':
      return 'muted';
    default:
      return 'dashboard-status--issues';
  }
}

export function ConnectorManagerScreen() {
  const { navigate } = useNavigation();
  const [statuses, setStatuses] = useState<ConnectorStatus[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [events, setEvents] = useState<ConnectorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<ConnectorStatus | null>(null);
  const [draftSettings, setDraftSettings] = useState<Record<string, unknown>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStatuses, nextHistory, nextEvents] = await Promise.all([
        window.kae.getConnectorStatuses(),
        window.kae.getConnectorSyncHistory(),
        window.kae.getConnectorEvents(),
      ]);
      setStatuses(nextStatuses);
      setHistory(nextHistory.slice(0, 10));
      setEvents(nextEvents.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connectedCount = statuses.filter((status) => status.config.connected).length;
  const briefing = useMemo(
    () => buildKaydConnectorsBriefing(statuses.length, connectedCount),
    [statuses.length, connectedCount],
  );

  const handleConnect = async (status: ConnectorStatus) => {
    setBusyId(status.connectorId);
    setError(null);
    try {
      await window.kae.connectConnector(status.connectorId, status.config);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    setBusyId(connectorId);
    setError(null);
    try {
      await window.kae.disconnectConnector(connectorId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleSync = async (status: ConnectorStatus) => {
    setBusyId(status.connectorId);
    setError(null);
    try {
      let sourcePath: string | null = null;
      if (status.connectorId === 'chatgpt-export-zip') {
        sourcePath = await window.kae.selectZipFile();
      } else if (status.connectorId === 'local-folder') {
        sourcePath = await window.kae.selectFolder();
      }
      await window.kae.syncConnector(status.connectorId, sourcePath);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const openConfigure = (status: ConnectorStatus) => {
    setConfiguring(status);
    setDraftSettings({ ...status.config.settings });
  };

  const saveConfigure = async () => {
    if (!configuring) return;
    setBusyId(configuring.connectorId);
    setError(null);
    try {
      const nextConfig: Partial<ConnectorConfig> = {
        settings: draftSettings,
        scheduledSyncEnabled: Boolean(draftSettings.scheduledSyncEnabled),
        scheduleIntervalMinutes: Number(draftSettings.scheduleIntervalMinutes ?? 60),
      };
      await window.kae.updateConnectorConfig(configuring.connectorId, nextConfig);
      setConfiguring(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && statuses.length === 0) {
    return (
      <div className="screen screen--conversation-first">
        <LoadingIndicator label="Loading connectors…" />
      </div>
    );
  }

  return (
    <KaydWorkspaceLayout
      workspaceScreen="connectors"
      workspaceClassName="screen--connectors"
      briefing={briefing}
      composerId={KAYD_WORKSPACE_COMPOSER_ID}
      briefingStatus={KAYD_BRIEFING_STATUS.connectors}
    >
      <section className="screen-evidence" aria-label="Connector management">
        <header className="screen-evidence__header screen-evidence__header--split">
          <div>
            <h3 className="screen-evidence__title">Connector management</h3>
            <p className="screen-evidence__lead muted">Health, sync, and monitoring for all connectors.</p>
          </div>
          <button
            type="button"
            className="vigsy-link-btn workspace-nav-link"
            onClick={() => navigate('import')}
          >
            Knowledge Sources →
          </button>
        </header>

      {error ? <p className="form__error">{error}</p> : null}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Connector</th>
              <th>Status</th>
              <th>Connected</th>
              <th>Last Sync</th>
              <th>Monitoring</th>
              <th>Last Checked</th>
              <th>Next Check</th>
              <th>Last Change</th>
              <th>Last Auto-Sync</th>
              <th>Items Imported</th>
              <th>Health</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <tr key={status.connectorId}>
                <td>
                  <strong>{status.name}</strong>
                  <div className="muted">{status.implementationStatus === 'stub' ? 'API-ready' : 'Full'}</div>
                </td>
                <td>{status.config.enabled ? 'Enabled' : 'Disabled'}</td>
                <td>{status.config.connected ? 'Yes' : 'No'}</td>
                <td>{formatTime(status.lastSyncAt)}</td>
                <td>{status.monitoring.active ? 'Active' : 'Inactive'}</td>
                <td>{formatTime(status.monitoring.lastCheckedAt)}</td>
                <td>{formatTime(status.monitoring.nextCheckAt)}</td>
                <td>{formatTime(status.monitoring.lastChangeDetectedAt)}</td>
                <td>{formatTime(status.monitoring.lastSuccessfulAutoSyncAt)}</td>
                <td>{status.itemsImported}</td>
                <td>
                  <span className={healthClass(status.health.status)}>{status.health.status}</span>
                </td>
                <td className="table__actions">
                  {!status.config.connected ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={busyId === status.connectorId || status.implementationStatus === 'stub'}
                      onClick={() => void handleConnect(status)}
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={busyId === status.connectorId}
                      onClick={() => void handleDisconnect(status.connectorId)}
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    disabled={busyId === status.connectorId}
                    onClick={() => openConfigure(status)}
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={
                      busyId === status.connectorId ||
                      !status.config.connected ||
                      status.implementationStatus === 'stub'
                    }
                    onClick={() => void handleSync(status)}
                  >
                    Sync Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {configuring ? (
        <section className="card form">
          <h3>Configure {configuring.name}</h3>
          {configuring.connectorId === 'youtube' ? (
            <>
              <div className="form__group">
                <label htmlFor="youtube-url">YouTube URL</label>
                <input
                  id="youtube-url"
                  value={String(draftSettings.targetUrl ?? '')}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, targetUrl: e.target.value })
                  }
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
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, maxVideos: Number(e.target.value) })
                  }
                />
              </div>
            </>
          ) : null}
          {configuring.connectorId === 'github' ? (
            <>
              <div className="form__group">
                <label htmlFor="github-repo">Repository (owner/repo)</label>
                <input
                  id="github-repo"
                  value={String(draftSettings.repository ?? '')}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, repository: e.target.value })
                  }
                  placeholder="octocat/Hello-World"
                />
              </div>
              <div className="form__group">
                <label htmlFor="github-token">API token (optional)</label>
                <input
                  id="github-token"
                  type="password"
                  value={String(draftSettings.apiKey ?? '')}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, apiKey: e.target.value })
                  }
                />
              </div>
            </>
          ) : null}
          {configuring.connectorId === 'local-folder' ? (
            <div className="form__group">
              <label htmlFor="folder-path">Folder path</label>
              <input
                id="folder-path"
                value={String(draftSettings.folderPath ?? '')}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, folderPath: e.target.value })
                }
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
                  setDraftSettings({
                    ...draftSettings,
                    scheduledSyncEnabled: e.target.checked,
                  })
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
                setDraftSettings({
                  ...draftSettings,
                  scheduleIntervalMinutes: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setConfiguring(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={() => void saveConfigure()}>
              Save
            </button>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h3>Recent Sync History</h3>
        {history.length === 0 ? (
          <p className="muted">No sync history yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Connector</th>
                <th>Completed</th>
                <th>Imported</th>
                <th>Updated</th>
                <th>Skipped</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.syncId}>
                  <td>{entry.connectorId}</td>
                  <td>{formatTime(entry.completedAt)}</td>
                  <td>{entry.itemsImported}</td>
                  <td>{entry.itemsUpdated}</td>
                  <td>{entry.itemsSkipped}</td>
                  <td>{entry.success ? 'PASS' : entry.error ?? 'FAIL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>Connector Event Log</h3>
        {events.length === 0 ? (
          <p className="muted">No connector events yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Connector</th>
                <th>Event</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 10).map((entry) => (
                <tr key={entry.eventId}>
                  <td>{formatTime(entry.timestamp)}</td>
                  <td>{entry.connectorId}</td>
                  <td>{entry.type}</td>
                  <td>{entry.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      </section>
    </KaydWorkspaceLayout>
  );
}

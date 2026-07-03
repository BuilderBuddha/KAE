import type { ConnectorStatus } from '@scooper/core';
import {
  PRIMARY_KNOWLEDGE_SOURCES,
  type ImportSourceDisplay,
  sourceBadge,
} from '../../utils/import-source-display';

function formatSyncTime(value?: string): string {
  if (!value) return 'Never synced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'â€”';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface ActiveConnectionsBarProps {
  connectors: ConnectorStatus[];
  selectedSourceId: string;
  busy: boolean;
  onSelect: (sourceId: string) => void;
  onSync: (connectorId: string) => void;
}

export function ActiveConnectionsBar({
  connectors,
  selectedSourceId,
  busy,
  onSelect,
  onSync,
}: ActiveConnectionsBarProps) {
  const connectorById = new Map(connectors.map((c) => [c.connectorId, c]));
  const sourceById = new Map(PRIMARY_KNOWLEDGE_SOURCES.map((s) => [s.id, s]));

  const active = connectors.filter(
    (c) => c.config.connected && c.implementationStatus === 'full',
  );
  const ready = PRIMARY_KNOWLEDGE_SOURCES.filter((source) => {
    if (source.uiOnly) return false;
    const connector = connectorById.get(source.id);
    return connector?.implementationStatus === 'full' && !connector.config.connected;
  });

  if (active.length === 0 && ready.length === 0) return null;

  return (
    <section className="active-connections" aria-label="Knowledge source connections">
      <header className="active-connections__header">
        <h4 className="active-connections__title">Connections</h4>
        <p className="active-connections__lead muted">
          {active.length > 0
            ? `${active.length} active Â· connect more sources to run in parallel`
            : 'Connect sources below â€” multiple can run at once'}
        </p>
      </header>

      {active.length > 0 ? (
        <ul className="active-connections__list">
          {active.map((connector) => {
            const source = sourceById.get(connector.connectorId);
            if (!source) return null;
            const monitoring = connector.monitoring.active;
            const healthy = connector.health.status === 'healthy';
            return (
              <li key={connector.connectorId}>
                <button
                  type="button"
                  className={`active-connections__chip${
                    selectedSourceId === connector.connectorId ? ' active-connections__chip--selected' : ''
                  }`}
                  onClick={() => onSelect(connector.connectorId)}
                >
                  <span className="active-connections__chip-name">{source.label}</span>
                  <span
                    className={`active-connections__chip-status active-connections__chip-status--${
                      monitoring ? 'monitoring' : healthy ? 'idle' : 'idle'
                    }`}
                  >
                    {monitoring ? 'Monitoring' : 'Connected'}
                  </span>
                  <span className="active-connections__chip-meta muted">
                    {connector.itemsImported} items Â· {formatSyncTime(connector.lastSyncAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm active-connections__sync"
                  disabled={busy}
                  onClick={() => onSync(connector.connectorId)}
                >
                  Sync
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {ready.length > 0 ? (
        <div className="active-connections__ready">
          <span className="active-connections__ready-label muted">Available to connect:</span>
          <div className="active-connections__ready-chips">
            {ready.map((source: ImportSourceDisplay) => (
              <button
                key={source.id}
                type="button"
                className="active-connections__ready-chip"
                onClick={() => onSelect(source.id)}
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Connected indicator for source grid cards. */
export function connectionIndicator(
  source: ImportSourceDisplay,
  connector?: ConnectorStatus,
): string | null {
  const badge = sourceBadge(source, connector);
  if (badge === 'connected') {
    if (connector?.monitoring.active) return 'Monitoring';
    return 'Connected';
  }
  return null;
}

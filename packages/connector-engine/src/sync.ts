import type { ConnectorId, ConnectorResult, ConnectorContext, FileReference } from '@scooper/core';
import type { ConnectorManager } from './manager.js';

/** Runs an on-demand connector sync. */
export async function syncConnectorNow(
  manager: ConnectorManager,
  connectorId: ConnectorId,
  source: FileReference | null,
  context?: ConnectorContext,
): Promise<ConnectorResult> {
  return manager.syncNow(connectorId, source, context);
}

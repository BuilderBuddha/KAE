import type { Connector, ConnectorContext, ConnectorHealth } from '@scooper/core';

/** Checks health for a single connector. */
export async function checkConnectorHealth(
  connector: Connector,
  context: ConnectorContext,
): Promise<ConnectorHealth> {
  return connector.checkHealth(context);
}

/** Aggregates health for multiple connectors. */
export async function checkAllConnectorHealth(
  connectors: Connector[],
  context: ConnectorContext,
): Promise<ConnectorHealth[]> {
  return Promise.all(connectors.map((connector) => connector.checkHealth(context)));
}

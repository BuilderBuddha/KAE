import type { ConnectorAuth, ConnectorConfig } from '@scooper/core';

/** Resolves connector auth state from persisted config. */
export function resolveConnectorAuth(config: ConnectorConfig): ConnectorAuth {
  const apiKey = String(config.settings.apiKey ?? '').trim();
  if (apiKey) {
    return { type: 'api_key', configured: true, label: 'API Key configured' };
  }
  const token = String(config.settings.token ?? '').trim();
  if (token) {
    return { type: 'token', configured: true, label: 'Token configured' };
  }
  if (config.settings.oauthConnected) {
    return { type: 'oauth', configured: true, label: 'OAuth connected' };
  }
  return { type: 'none', configured: true };
}

/** Stores API key in connector config settings (not app-wide settings). */
export function withApiKey(config: ConnectorConfig, apiKey: string): ConnectorConfig {
  return {
    ...config,
    settings: {
      ...config.settings,
      apiKey,
    },
  };
}

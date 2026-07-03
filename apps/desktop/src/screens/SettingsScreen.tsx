import { useEffect, useState } from 'react';
import type {
  AIProviderId,
  AppSettings,
  LogLevel,
  ProviderCapabilities,
  ProviderHealthResult,
} from '@scooper/core';

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [providers, setProviders] = useState<ProviderCapabilities[]>([]);
  const [health, setHealth] = useState<ProviderHealthResult | null>(null);
  const [keyStatus, setKeyStatus] = useState<{
    secureStorage: 'available' | 'dev_fallback';
    providers: Record<string, boolean>;
  } | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const refreshProviderState = async () => {
    const [nextHealth, nextKeyStatus] = await Promise.all([
      window.kae.getProviderHealth(),
      window.kae.getProviderKeyStatus(),
    ]);
    setHealth(nextHealth);
    setKeyStatus(nextKeyStatus);
  };

  useEffect(() => {
    void Promise.all([window.kae.getSettings(), window.kae.listAiProviders()]).then(
      async ([nextSettings, nextProviders]) => {
        setSettings(nextSettings);
        setProviders(nextProviders);
        await refreshProviderState();
      },
    );
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    const updated = await window.kae.setSettings(settings);
    setSettings(updated);
    if (apiKeyDraft.trim()) {
      await window.kae.setProviderApiKey(settings.aiProvider, apiKeyDraft);
      setApiKeyDraft('');
    }
    await refreshProviderState();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestProvider = async () => {
    if (!settings) return;
    const result = await window.kae.testAiProvider(settings.aiProvider);
    setHealth(result);
  };

  if (!settings) {
    return (
      <div className="screen">
        <p className="muted">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Settings</h2>
        <p className="screen__description">Configure application preferences.</p>
      </header>

      <section className="card form">
        <div className="form__group">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) =>
              setSettings({ ...settings, theme: e.target.value as AppSettings['theme'] })
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="form__group">
          <label htmlFor="log-level">Log Level</label>
          <select
            id="log-level"
            value={settings.logLevel}
            onChange={(e) =>
              setSettings({ ...settings, logLevel: e.target.value as LogLevel })
            }
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="form__group">
          <label htmlFor="ai-provider">AI Provider</label>
          <select
            id="ai-provider"
            value={settings.aiProvider}
            onChange={(e) =>
              setSettings({ ...settings, aiProvider: e.target.value as AIProviderId })
            }
          >
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="form__group">
          <label htmlFor="ai-model">AI Model (optional)</label>
          <input
            id="ai-model"
            type="text"
            value={settings.aiModel ?? ''}
            onChange={(e) => setSettings({ ...settings, aiModel: e.target.value || undefined })}
            spellCheck={false}
          />
        </div>

        <div className="form__group">
          <label htmlFor="ai-temperature">Temperature</label>
          <input
            id="ai-temperature"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={settings.aiTemperature}
            onChange={(e) =>
              setSettings({ ...settings, aiTemperature: Number(e.target.value) })
            }
          />
        </div>

        <div className="form__group">
          <label htmlFor="ai-streaming">
            <input
              id="ai-streaming"
              type="checkbox"
              checked={settings.aiStreaming}
              onChange={(e) => setSettings({ ...settings, aiStreaming: e.target.checked })}
            />{' '}
            Enable provider streaming
          </label>
        </div>

        <div className="form__group">
          <label htmlFor="ai-api-key">Provider API Key</label>
          <input
            id="ai-api-key"
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            placeholder={
              keyStatus?.providers[settings.aiProvider]
                ? 'Key stored — enter to replace'
                : 'Enter API key (stored securely)'
            }
            spellCheck={false}
            autoComplete="off"
          />
          {keyStatus ? (
            <p className="muted form__hint">
              Credential storage:{' '}
              {keyStatus.secureStorage === 'available'
                ? 'OS secure storage'
                : 'Development fallback only'}
            </p>
          ) : null}
        </div>

        {health ? (
          <div className="form__group">
            <p className="form__status">
              Provider status: <strong>{health.status}</strong> — {health.message}
            </p>
          </div>
        ) : null}

        <div className="form__group">
          <label htmlFor="output-dir">Output Directory</label>
          <input
            id="output-dir"
            type="text"
            value={settings.outputDirectory}
            onChange={(e) => setSettings({ ...settings, outputDirectory: e.target.value })}
            spellCheck={false}
          />
        </div>

        <div className="form__actions">
          <button type="button" className="btn btn--secondary" onClick={() => void handleTestProvider()}>
            Test Provider
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void handleSave()}>
            Save
          </button>
          {saved && <span className="form__saved">Saved</span>}
        </div>
      </section>
    </div>
  );
}

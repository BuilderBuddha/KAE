import { useEffect, useState } from 'react';
import type { AppSettings, LogLevel } from '@scooper/core';

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.kae.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    const updated = await window.kae.setSettings(settings);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <label htmlFor="max-jobs">Max Concurrent Jobs</label>
          <input
            id="max-jobs"
            type="number"
            min={1}
            max={10}
            value={settings.maxConcurrentJobs}
            onChange={(e) =>
              setSettings({ ...settings, maxConcurrentJobs: Number(e.target.value) })
            }
          />
        </div>

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
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
          {saved && <span className="form__saved">Saved</span>}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { RepositoryConfig } from '@scooper/core';

export function RepositorySettingsScreen() {
  const [config, setConfig] = useState<RepositoryConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.kae.getRepositoryConfig().then(setConfig);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    const updated = await window.kae.setRepositoryConfig(config);
    setConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    const defaultPath = await window.kae.getDefaultRepositoryPath();
    setConfig((prev) => (prev ? { ...prev, path: defaultPath } : prev));
  };

  if (!config) {
    return (
      <div className="screen">
        <p className="muted">Loading repository settings…</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Repository Settings</h2>
        <p className="screen__description">
          Configure the target Axiom Knowledge Repository for imported knowledge.
        </p>
      </header>

      <section className="card form">
        <div className="form__group">
          <label htmlFor="repo-name">Repository Name</label>
          <input
            id="repo-name"
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>

        <div className="form__group">
          <label htmlFor="repo-path">Repository Path</label>
          <input
            id="repo-path"
            type="text"
            value={config.path}
            onChange={(e) => setConfig({ ...config, path: e.target.value })}
            spellCheck={false}
          />
          <p className="form__hint">Default: C:\Users\alber\Axiom-Knowledge</p>
        </div>

        <div className="form__group form__group--checkbox">
          <label>
            <input
              type="checkbox"
              checked={config.autoSync}
              onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
            />
            Auto-sync after import
          </label>
        </div>

        <div className="form__actions">
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleReset}>
            Reset Path
          </button>
          {saved && <span className="form__saved">Saved</span>}
        </div>
      </section>
    </div>
  );
}

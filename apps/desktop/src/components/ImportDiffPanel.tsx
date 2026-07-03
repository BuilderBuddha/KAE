import type { ImportDiffPreview } from '@scooper/core';

interface ImportDiffPanelProps {
  diff: ImportDiffPreview;
}

function FileList({ title, files }: { title: string; files: string[] }) {
  if (files.length === 0) return null;
  return (
    <div className="diff-section">
      <h4>
        {title} <span className="diff-section__count">({files.length})</span>
      </h4>
      <ul className="diff-list">
        {files.slice(0, 20).map((f) => (
          <li key={f}>
            <code>{f}</code>
          </li>
        ))}
        {files.length > 20 && <li className="muted">…and {files.length - 20} more</li>}
      </ul>
    </div>
  );
}

export function ImportDiffPanel({ diff }: ImportDiffPanelProps) {
  return (
    <div className="import-diff">
      <h3 className="import-summary__title">Repository Change Preview</h3>
      <p className="muted">
        Preview only — estimated {diff.estimatedTotalChanges} change(s). No files modified yet.
      </p>

      <dl className="import-summary__stats">
        <div>
          <dt>Estimated changes</dt>
          <dd>{diff.estimatedTotalChanges}</dd>
        </div>
        <div>
          <dt>Deleted files</dt>
          <dd>{diff.deletedFiles.length}</dd>
        </div>
      </dl>

      <FileList title="Sources added" files={diff.sourcesAdded} />
      <FileList title="Sources updated" files={diff.sourcesUpdated} />
      <FileList title="Sessions added" files={diff.sessionsAdded} />
      <FileList title="Sessions updated" files={diff.sessionsUpdated} />
      <FileList title="Registries updated" files={diff.registriesUpdated} />
      <FileList title="Uploads added" files={diff.uploadsAdded} />
      <FileList title="Duplicates skipped" files={diff.duplicatesSkipped} />
      <FileList title="Modified files" files={diff.modifiedFiles} />
    </div>
  );
}

import type { ImportValidationReport } from '@scooper/core';

function formatMs(ms?: number): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface ValidationReportPanelProps {
  report: ImportValidationReport;
}

export function ValidationReportPanel({ report }: ValidationReportPanelProps) {
  return (
    <div className="validation-report">
      <div className="validation-report__header">
        <h3 className="import-summary__title">Validation Report</h3>
        <p className="muted">
          Validated {report.validatedAt ? new Date(report.validatedAt).toLocaleString() : '—'}
          {' · '}
          {formatMs(report.durationMs)}
        </p>
      </div>

      <dl className="import-summary__stats validation-report__checks">
        <div>
          <dt>ZIP integrity</dt>
          <dd className={report.zipReadable ? 'status-ok' : 'status-bad'}>
            {report.zipReadable ? 'Pass' : 'Fail'}
          </dd>
        </div>
        <div>
          <dt>Export structure</dt>
          <dd className={report.chatGptStructureDetected ? 'status-ok' : 'status-bad'}>
            {report.chatGptStructureDetected ? 'Detected' : 'Not detected'}
          </dd>
        </div>
        <div>
          <dt>conversations.json</dt>
          <dd className={report.conversationsJsonPresent ? 'status-ok' : 'status-bad'}>
            {report.conversationsJsonPresent ? 'Present' : 'Missing'}
          </dd>
        </div>
        <div>
          <dt>Conversations</dt>
          <dd>{report.conversationsFound}</dd>
        </div>
        <div>
          <dt>Uploaded files</dt>
          <dd>{report.uploadedFilesCount}</dd>
        </div>
        <div>
          <dt>Sources to create</dt>
          <dd>{report.estimatedSourcesToCreate}</dd>
        </div>
        <div>
          <dt>Sources to update</dt>
          <dd>{report.estimatedSourcesToUpdate}</dd>
        </div>
        <div>
          <dt>Duplicates skipped</dt>
          <dd>{report.estimatedDuplicatesSkipped}</dd>
        </div>
        <div>
          <dt>Uncertain</dt>
          <dd>{report.uncertainCount}</dd>
        </div>
        <div>
          <dt>Repository target</dt>
          <dd className="validation-report__path">
            <code>{report.repositoryPath}</code>
          </dd>
        </div>
      </dl>

      {report.uploadedFileNames.length > 0 && (
        <div className="import-summary__ids">
          <p className="import-summary__label">Uploaded files:</p>
          <p>
            {report.uploadedFileNames.slice(0, 10).join(', ')}
            {report.uploadedFileNames.length > 10 ? ` (+${report.uploadedFileNames.length - 10} more)` : ''}
          </p>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="validation-report__section">
          <h4>Warnings</h4>
          <ul className="import-summary__warnings">
            {report.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {(report.errors.length > 0 || report.blockingErrors.length > 0) && (
        <div className="validation-report__section">
          <h4>Errors</h4>
          <ul className="import-summary__errors">
            {[...new Set([...report.blockingErrors, ...report.errors])].map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="validation-report__section">
        <h4>Estimated output</h4>
        <p className="import-summary__folder">
          Sources: <code>{report.outputLocations.sourcesRoot}</code>
        </p>
        <p className="import-summary__folder">
          Uploads: <code>{report.outputLocations.uploadsPattern}</code>
        </p>
        <p className="import-summary__folder">
          Review: <code>{report.outputLocations.reviewPath}</code>
        </p>
      </div>
    </div>
  );
}

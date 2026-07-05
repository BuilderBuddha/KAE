import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ConnectorEvent,
  ConnectorStatus,
  ImportSummary,
  ImportTimelineStep,
  ImportValidationReport,
  SyncHistoryEntry,
  ValidationProgress,
} from '@scooper/core';
import { ImportDiffPanel } from '../components/ImportDiffPanel';
import { ImportTimeline } from '../components/ImportTimeline';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { KnowledgeSourceDetail } from '../components/knowledge/KnowledgeSourceDetail';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SafeImportGuarantee } from '../components/SafeImportGuarantee';
import { ValidationProgressPanel } from '../components/ValidationProgressPanel';
import { ValidationReportPanel } from '../components/ValidationReportPanel';
import { buildKaydConnectorWalkthrough, buildKaydImportBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';
import {
  ADVANCED_IMPORTER_IDS,
  badgeLabel,
  PRIMARY_KNOWLEDGE_SOURCES,
  sourceBadge,
} from '../utils/import-source-display';

interface ImporterInfo {
  id: string;
  name: string;
  description: string;
  supportedExtensions: readonly string[];
}

const INITIAL_VALIDATION_PROGRESS = (): ValidationProgress => ({
  status: 'running',
  stage: 'zip-selected',
  stageLabel: 'ZIP selected',
  conversationsTotal: 0,
  conversationsProcessed: 0,
  messagesProcessed: 0,
  warningsGenerated: 0,
  startedAt: new Date().toISOString(),
  elapsedMs: 0,
});

export function ImportScreen() {
  const [importers, setImporters] = useState<ImporterInfo[]>([]);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [connectorEvents, setConnectorEvents] = useState<ConnectorEvent[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('chatgpt-export-zip');
  const [connectorBusy, setConnectorBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ImportValidationReport | null>(null);
  const [validationProgress, setValidationProgress] = useState<ValidationProgress | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [timeline, setTimeline] = useState<ImportTimelineStep[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSources = useCallback(async () => {
    const [nextImporters, nextConnectors, nextHistory, nextEvents] = await Promise.all([
      window.kae.getImporters(),
      window.kae.getConnectorStatuses(),
      window.kae.getConnectorSyncHistory(),
      window.kae.getConnectorEvents(),
    ]);
    setImporters(nextImporters);
    setConnectors(nextConnectors);
    setSyncHistory(nextHistory);
    setConnectorEvents(nextEvents);
  }, []);

  useEffect(() => {
    refreshSources().finally(() => setLoading(false));
  }, [refreshSources]);

  useEffect(() => {
    const unsubComplete = window.kae.onImportComplete((result) => {
      setSummary(result);
      setImporting(false);
      setValidation(null);
      setValidationProgress(null);
      setPendingFile(null);
      if (result.timeline) setTimeline(result.timeline);
    });
    const unsubTimeline = window.kae.onImportTimeline((steps) => setTimeline(steps));
    const unsubValidation = window.kae.onValidationProgress((progress) => {
      setValidationProgress(progress);
    });
    return () => {
      unsubComplete();
      unsubTimeline();
      unsubValidation();
    };
  }, []);

  useEffect(() => {
    if (validating) {
      elapsedTimerRef.current = setInterval(() => {
        setValidationProgress((prev) =>
          prev && prev.status === 'running'
            ? { ...prev, elapsedMs: Date.now() - new Date(prev.startedAt).getTime() }
            : prev,
        );
      }, 1000);
    } else if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [validating]);

  const resetValidationState = useCallback(() => {
    setValidation(null);
    setValidationProgress(null);
    setPendingFile(null);
    setError(null);
    setCancelling(false);
  }, []);

  const runValidation = useCallback(async (filePath: string) => {
    setError(null);
    setSummary(null);
    setValidation(null);
    setTimeline([]);
    setPendingFile(filePath);
    setValidating(true);
    setCancelling(false);
    setValidationProgress({
      ...INITIAL_VALIDATION_PROGRESS(),
      fileName: filePath.split(/[/\\]/).pop(),
      detail: filePath.split(/[/\\]/).pop(),
    });

    try {
      const report = await window.kae.validateChatGptZip(filePath);
      setValidation(report);
      if (!report.valid) {
        const reason =
          report.blockingErrors.join('; ') ||
          report.errors.join('; ') ||
          'Validation failed.';
        setError(reason);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setValidationProgress((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              stage: 'failed',
              stageLabel: 'Validation failed',
              error: message,
              detail: message,
            }
          : null,
      );
    } finally {
      setValidating(false);
      setCancelling(false);
    }
  }, []);

  const handleCancelValidation = useCallback(async () => {
    if (validating) {
      setCancelling(true);
      await window.kae.cancelValidation();
    } else {
      resetValidationState();
    }
  }, [validating, resetValidationState]);

  const runConfirmImport = useCallback(async () => {
    if (!pendingFile || !validation?.valid) return;
    setImporting(true);
    setError(null);
    setTimeline([]);
    setValidationProgress(null);
    try {
      const result = await window.kae.importChatGptZip(pendingFile);
      setSummary(result);
      setValidation(null);
      setPendingFile(null);
      if (result.timeline) setTimeline(result.timeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }, [pendingFile, validation]);

  const handleBrowse = async () => {
    const filePath = await window.kae.selectZipFile();
    if (filePath) await runValidation(filePath);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && 'path' in file && typeof (file as File & { path: string }).path === 'string') {
      await runValidation((file as File & { path: string }).path);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please drop a .zip file (ChatGPT export). Repository unchanged.');
      return;
    }
    if ('path' in file && typeof (file as File & { path: string }).path === 'string') {
      await runValidation((file as File & { path: string }).path);
    } else {
      setError('Could not read file path. Use Browse to select the file.');
    }
  };

  const busy = validating || importing;
  const validationFailed = validation && !validation.valid;
  const showValidationProgress =
    validationProgress && (validating || validationProgress.status !== 'complete' || validationFailed);

  const connectorById = useMemo(
    () => new Map(connectors.map((status) => [status.connectorId, status])),
    [connectors],
  );

  const advancedImporters = importers.filter((importer) => ADVANCED_IMPORTER_IDS.has(importer.id));
  const importBriefing = useMemo(() => buildKaydImportBriefing(connectors), [connectors]);
  const selectedSource = PRIMARY_KNOWLEDGE_SOURCES.find((s) => s.id === selectedSourceId);
  const selectedConnector = selectedSource ? connectorById.get(selectedSource.id) : undefined;
  const connectorWalkthrough = useMemo(
    () => (selectedSource ? buildKaydConnectorWalkthrough(selectedSource, selectedConnector) : []),
    [selectedSource, selectedConnector],
  );
  const sourceEvents = useMemo(
    () => connectorEvents.filter((event) => event.connectorId === selectedSourceId).slice(0, 8),
    [connectorEvents, selectedSourceId],
  );

  return (
    <KaydWorkspaceLayout
      workspaceScreen="import"
      workspaceClassName="screen--import"
      briefing={importBriefing}
      composerId={KAYD_WORKSPACE_COMPOSER_ID}
      briefingStatus={KAYD_BRIEFING_STATUS.import}
      contextWalkthrough={connectorWalkthrough}
      contextWalkthroughKey={selectedSourceId}
      contextWalkthroughTitle={selectedSource ? `${selectedSource.label} walkthrough` : undefined}
    >
      <section className="screen-evidence" aria-label="Knowledge sources">
        <header className="screen-evidence__header">
          <div>
            <h3 className="screen-evidence__title">Knowledge sources</h3>
            <p className="screen-evidence__lead muted">Select a source — KayD will guide you through connect and sync.</p>
          </div>
        </header>

        {loading ? (
          <LoadingIndicator label="Loading sources…" />
        ) : (
          <ul className="import-source-grid">
            {PRIMARY_KNOWLEDGE_SOURCES.map((source) => {
              const connector = connectorById.get(source.id);
              const badge = sourceBadge(source, connector);
              return (
                <li key={source.id}>
                  <button
                    type="button"
                    className={`card import-source-card import-source-card--selectable${
                      selectedSourceId === source.id ? ' import-source-card--active' : ''
                    }`}
                    onClick={() => setSelectedSourceId(source.id)}
                  >
                    <div className="import-source-card__header">
                      <h4 className="import-source-card__name">{source.label}</h4>
                      <span className={`badge badge--${badge === 'stub' ? 'stub' : 'ready'}`}>
                        {badgeLabel(badge)}
                      </span>
                    </div>
                    <p className="import-source-card__description">{source.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selectedSource ? (
          <KnowledgeSourceDetail
            source={selectedSource}
            status={connectorById.get(selectedSource.id)}
            history={syncHistory}
            events={sourceEvents}
            busy={connectorBusy}
            onRefresh={async () => {
              setConnectorBusy(true);
              try {
                await refreshSources();
              } finally {
                setConnectorBusy(false);
              }
            }}
          />
        ) : null}

        {selectedSourceId === 'chatgpt-export-zip' ? (
          <>
            <SafeImportGuarantee
              variant={validationFailed || (error && !validation?.valid) ? 'failed' : 'default'}
              reason={validationFailed ? error ?? undefined : undefined}
            />
            <section className="screen-evidence__subsection">
              <h3 className="screen__section-title">ChatGPT export</h3>
              <p className="muted import-hint">
                Drop an export ZIP to connect ChatGPT conversations. Export from ChatGPT Settings → Data Controls → Export.
              </p>
              <div
                className={`card card--dashed import-dropzone${dragOver ? ' import-dropzone--active' : ''}${busy ? ' import-dropzone--busy' : ''}`}
                aria-label="Import drop zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="import-dropzone__input"
                  onChange={handleFileInput}
                  disabled={busy}
                />
                <div className="import-dropzone__icon">{busy ? '⏳' : '↓'}</div>
                <p className="import-dropzone__title">
                  {validating ? 'Validating…' : importing ? 'Importing…' : 'Drop ChatGPT export ZIP here'}
                </p>
                <p className="import-dropzone__hint">
                  {pendingFile
                    ? `Selected: ${pendingFile.split(/[/\\]/).pop()}`
                    : 'Or browse to select a .zip file'}
                </p>
                <button
                  type="button"
                  className="btn btn--primary import-dropzone__browse"
                  onClick={handleBrowse}
                  disabled={busy}
                >
                  Browse…
                </button>
              </div>
            </section>
          </>
        ) : null}

        {showValidationProgress && validationProgress && (
        <ValidationProgressPanel
          progress={validationProgress}
          onCancel={handleCancelValidation}
          cancelling={cancelling}
        />
      )}

      {validating && !validationProgress && (
        <LoadingIndicator label="Validating export (read-only)…" />
      )}

      {error && (
        <section className="card import-error" role="alert">
          <p>{error}</p>
          {!validating && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={resetValidationState}>
              Reset
            </button>
          )}
        </section>
      )}

      {(importing || timeline.length > 0) && (
        <section className="card">
          <h3 className="import-summary__title">Import Progress</h3>
          <ImportTimeline steps={timeline} />
        </section>
      )}

      {validation && (
        <section className="card import-summary">
          <ValidationReportPanel report={validation} />
          {validation.diffPreview && <ImportDiffPanel diff={validation.diffPreview} />}

          {validation.valid && (
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={runConfirmImport}
                disabled={importing}
              >
                Confirm Import
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={resetValidationState}
                disabled={importing}
              >
                Cancel
              </button>
            </div>
          )}

          {validationFailed && (
            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={resetValidationState}>
                Reset
              </button>
            </div>
          )}
        </section>
      )}

      {summary && (
        <section className="card import-summary">
          <h3 className="import-summary__title">Import Complete</h3>
          <dl className="import-summary__stats">
            <div>
              <dt>Duration</dt>
              <dd>
                {summary.durationMs != null ? `${(summary.durationMs / 1000).toFixed(1)}s` : '—'}
              </dd>
            </div>
            <div>
              <dt>Connector</dt>
              <dd>{summary.connectorName ?? 'ChatGPT Connector'}</dd>
            </div>
            <div>
              <dt>Sources created</dt>
              <dd>{summary.sourcesCreated}</dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{summary.sessionsCreated ?? '—'}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd>{summary.skippedDuplicates}</dd>
            </div>
            <div>
              <dt>Git ready</dt>
              <dd>{summary.gitReadiness?.status ?? '—'}</dd>
            </div>
          </dl>
          {summary.snapshotPath && (
            <p className="import-summary__folder">
              Snapshot: <code>{summary.snapshotPath}</code>
            </p>
          )}
          {summary.importReportPath && (
            <p className="import-summary__folder">
              Import report: <code>{summary.importReportPath}</code>
            </p>
          )}
          {summary.reviewFile && (
            <p className="import-summary__folder">
              Review file: <code>{summary.reviewFile}</code>
            </p>
          )}
          {summary.createdSourceIds.length > 0 && (
            <div className="import-summary__ids">
              <p className="import-summary__label">Created source IDs:</p>
              <p>{summary.createdSourceIds.join(', ')}</p>
            </div>
          )}
          {summary.errors.length > 0 && (
            <ul className="import-summary__errors">
              {summary.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="import-advanced import-advanced--open" aria-label="Document imports">
        <h3 className="screen__section-title">Document imports</h3>
        <p className="muted import-advanced__lead">
          File-format imports for HTML, Markdown, JSON, TXT, and CSV — alongside connector-based sources above.
        </p>
        {advancedImporters.length > 0 ? (
          <ul className="importer-grid">
            {advancedImporters.map((importer) => (
              <li key={importer.id} className="card importer-card importer-card--advanced">
                <div className="importer-card__header">
                  <h4 className="importer-card__name">{importer.name}</h4>
                  <span className="badge badge--stub">Coming soon</span>
                </div>
                <p className="importer-card__description">{importer.description}</p>
                <div className="importer-card__extensions">
                  {importer.supportedExtensions.map((ext) => (
                    <span key={ext} className="tag">
                      {ext}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No document import options are configured.</p>
        )}
      </section>
      </section>
    </KaydWorkspaceLayout>
  );
}

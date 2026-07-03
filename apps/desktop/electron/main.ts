import { app, BrowserWindow, ipcMain, dialog, shell, clipboard, protocol } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_FULL_NAME,
  APP_NAME,
  createDefaultConfig,
  createImportJob,
  DEFAULT_REPOSITORY_PATH,
  type AppSettings,
  type RepositoryConfig,
  type LogEntry,
  type ImportSummary,
  type ImportValidationReport,
  type ImportPackage,
  type ImportTimelineStep,
  type ImportReport,
  type ValidationProgress,
  type RepairPlan,
  type RepairResult,
  InMemoryJobQueue,
} from '@scooper/core';
import { importerRegistry, stubImporters, validateChatGptZipImport } from '@scooper/importers';
import { exporterRegistry, axiomExporter } from '@scooper/exporters';
import {
  browseRepository,
  checkRepositoryHealth,
  createRepositorySnapshot,
  executeRepairPlan,
  generateRepairPlan,
  getRepositoryStats,
  detectMimeType,
  listChatGptImportEntries,
  parseChatGptSourceMarkdown,
  readRepositoryFile,
  resolveChatGptAssets,
  searchRepository,
  buildEvidenceIndex,
  summarizeEvidenceIndex,
  searchEvidence,
  evidenceResultsToRepositoryResults,
  getEvidenceDrilldown,
  answerKnowledgeQuestion,
  buildRelationshipIndex,
  summarizeRelationshipIndex,
  searchRelationships,
  getRelationshipsForEvidence,
  getRelatedEvidence,
  ensureRelationshipIndex,
  getExecutiveBriefing,
  refreshExecutiveBriefing,
  writeSessionManifest,
  writeImportReport,
} from '@scooper/repository-engine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'kae-asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

function parseKaeAssetRequestUrl(url: string): string {
  const prefix = 'kae-asset://resolve/';
  if (!url.startsWith(prefix)) {
    throw new Error('Invalid asset URL.');
  }
  return decodeURIComponent(url.slice(prefix.length));
}

let mainWindow: BrowserWindow | null = null;
let lastValidationReport: ImportValidationReport | null = null;
let lastValidatedImportPackage: ImportPackage | null = null;
let lastValidatedFilePath: string | null = null;
let lastImportSummary: ImportSummary | null = null;
let activeValidationAbort: AbortController | null = null;
let lastRepairPlan: RepairPlan | null = null;
let lastRepairResult: RepairResult | null = null;

const config = createDefaultConfig();
const jobQueue = new InMemoryJobQueue();
const logs: LogEntry[] = [];

function repoPath(): string {
  return config.repository.path;
}

function resolveRepoFile(relativePath: string): string {
  const full = path.resolve(repoPath(), relativePath);
  const root = path.resolve(repoPath());
  if (!full.startsWith(root)) throw new Error('Invalid file path.');
  return full;
}

function addLog(
  level: LogEntry['level'],
  source: string,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    context,
  };
  logs.unshift(entry);
  if (logs.length > 500) logs.pop();
  mainWindow?.webContents.send('kae:log-added', entry);
  return entry;
}

async function rebuildExecutiveBriefingCache(): Promise<void> {
  try {
    await refreshExecutiveBriefing(repoPath());
    mainWindow?.webContents.send('kae:executive-briefing-updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addLog('warn', 'awareness', `Executive briefing refresh failed: ${msg}`);
  }
}

async function appendPersistentImportLog(message: string): Promise<void> {
  const logPath = path.join(repoPath(), '.kae-sessions', 'import-trace.log');
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, line, 'utf8');
  } catch {
    // Best-effort disk log before heavy import work.
  }
}

function createTimeline(): ImportTimelineStep[] {
  return [
    { id: 'validate-zip', label: 'Validate ZIP', status: 'pending' },
    { id: 'analyze-export', label: 'Analyze Export', status: 'pending' },
    { id: 'generate-sources', label: 'Generate Sources', status: 'pending' },
    { id: 'create-snapshot', label: 'Create Snapshot', status: 'pending' },
    { id: 'update-repository', label: 'Update Repository', status: 'pending' },
    { id: 'update-registries', label: 'Update Registries', status: 'pending' },
    { id: 'health-check', label: 'Health Check', status: 'pending' },
    { id: 'git-readiness', label: 'Git Readiness', status: 'pending' },
    { id: 'complete', label: 'Complete', status: 'pending' },
  ];
}

function emitTimeline(steps: ImportTimelineStep[]): void {
  mainWindow?.webContents.send('kae:import-timeline', steps);
}

function setStep(
  steps: ImportTimelineStep[],
  id: ImportTimelineStep['id'],
  status: ImportTimelineStep['status'],
  detail?: string,
): void {
  const step = steps.find((s) => s.id === id);
  if (step) {
    step.status = status;
    step.detail = detail;
  }
  emitTimeline([...steps]);
}

function registerPlugins(): void {
  stubImporters.forEach((importer) => importerRegistry.register(importer));
  exporterRegistry.register(axiomExporter);
  addLog('info', 'system', `Registered ${stubImporters.length} connector plugin(s)`);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${APP_NAME} — ${APP_FULL_NAME}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function emitValidationProgress(progress: ValidationProgress): void {
  mainWindow?.webContents.send('kae:validation-progress', progress);
}

async function validateImport(filePath: string): Promise<ImportValidationReport> {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const fileRef = { path: filePath, name: fileName, extension: ext };

  if (activeValidationAbort) {
    activeValidationAbort.abort();
  }
  activeValidationAbort = new AbortController();
  const { signal } = activeValidationAbort;

  addLog('info', 'import', `Validating: ${fileName} (read-only — no repository writes)`, {
    filePath,
    fileName,
  });

  try {
    const report = await validateChatGptZipImport(fileRef, repoPath(), {
      signal,
      log: (level, message, context) => addLog(level, 'import', message, context),
      onProgress: emitValidationProgress,
      onImportPackageReady: (importPackage) => {
        lastValidatedImportPackage = importPackage;
        lastValidatedFilePath = filePath;
        void appendPersistentImportLog(
          `Validation cached import package: ${importPackage.documents.length} document(s) from ${fileName}`,
        );
      },
    });
    lastValidationReport = report;

    if (report.valid) {
      addLog(
        'info',
        'import',
        `Validation complete in ${report.durationMs ?? 0}ms: ${report.conversationsFound} conversation(s) — awaiting user confirmation`,
        {
          conversationsFound: report.conversationsFound,
          estimatedSourcesToCreate: report.estimatedSourcesToCreate,
          estimatedSourcesToUpdate: report.estimatedSourcesToUpdate,
          warnings: report.warnings.length,
        },
      );
    } else if (!signal.aborted) {
      addLog(
        'error',
        'import',
        `Validation failed — repository unchanged. ${report.blockingErrors.join('; ') || report.errors.join('; ') || 'Unknown error'}`,
        {
          blockingErrors: report.blockingErrors,
          errors: report.errors,
        },
      );
    }

    return report;
  } finally {
    activeValidationAbort = null;
  }
}

async function runImport(filePath: string, formatId: 'chatgpt-export-zip'): Promise<ImportSummary> {
  const started = Date.now();
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const jobId = crypto.randomUUID();
  const fileRef = { path: filePath, name: fileName, extension: ext };
  const timeline = createTimeline();
  emitTimeline(timeline);

  await appendPersistentImportLog(`Confirm import started: ${fileName} (${filePath})`);

  setStep(timeline, 'validate-zip', 'running');
  addLog('info', 'import', `Pre-import validation gate: ${fileName}`);
  let validationReport: ImportValidationReport;
  try {
    if (
      lastValidationReport?.valid &&
      lastValidationReport.filePath === filePath &&
      lastValidatedImportPackage &&
      lastValidatedFilePath === filePath
    ) {
      validationReport = lastValidationReport;
      await appendPersistentImportLog(
        `Reusing validated import package: ${lastValidatedImportPackage.documents.length} document(s) — no ZIP re-parse`,
      );
      addLog(
        'info',
        'import',
        `Reusing cached validation and import package (${lastValidatedImportPackage.documents.length} documents)`,
      );
    } else {
      validationReport = await validateChatGptZipImport(fileRef, repoPath(), {
        log: (level, message, context) => addLog(level, 'import', message, context),
        onImportPackageReady: (importPackage) => {
          lastValidatedImportPackage = importPackage;
          lastValidatedFilePath = filePath;
        },
      });
      lastValidationReport = validationReport;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStep(timeline, 'validate-zip', 'failed', msg);
    addLog('error', 'import', `Validation error — repository unchanged. ${msg}`);
    throw new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${msg}. Recovery: fix the export and validate again.`,
    );
  }

  if (!validationReport.valid) {
    const reason = validationReport.blockingErrors.join('; ') || 'Validation failed';
    setStep(timeline, 'validate-zip', 'failed', reason);
    addLog('error', 'import', `Import blocked — repository unchanged. ${reason}`);
    throw new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${reason}. Recovery: review the validation report and fix the export.`,
    );
  }
  setStep(timeline, 'validate-zip', 'complete', `${validationReport.conversationsFound} conversations`);

  const job = createImportJob(jobId, formatId, fileRef);
  job.status = 'queued';
  jobQueue.enqueue(job);
  mainWindow?.webContents.send('kae:job-updated', job);
  jobQueue.updateStatus(jobId, 'running', 0);
  mainWindow?.webContents.send('kae:job-updated', jobQueue.getById(jobId)!);

  const importer = importerRegistry.get(formatId);
  if (!importer) {
    const error = `No connector registered for format: ${formatId}`;
    jobQueue.updateStatus(jobId, 'failed', 0, error);
    addLog('error', 'import', `${error} — repository unchanged.`);
    throw new Error(error);
  }

  setStep(timeline, 'create-snapshot', 'running');
  addLog('info', 'repository', 'Creating pre-import snapshot…');
  const snapshotPath = await createRepositorySnapshot(repoPath(), jobId);
  const manifestPath = await writeSessionManifest(repoPath(), {
    sessionId: jobId,
    connectorId: formatId,
    sourceFile: fileName,
    startedAt: new Date().toISOString(),
    repositoryPath: repoPath(),
    snapshotPath,
    validationPassed: true,
    plannedCreates: validationReport.estimatedSourcesToCreate,
    plannedUpdates: validationReport.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: snapshotPath, manifestPath: '' },
  });
  setStep(timeline, 'create-snapshot', 'complete', path.basename(snapshotPath));
  addLog('info', 'repository', `Snapshot saved: ${snapshotPath}`);

  setStep(timeline, 'analyze-export', 'running');
  await appendPersistentImportLog(
    `Analyze export: using cached package=${Boolean(lastValidatedImportPackage && lastValidatedFilePath === filePath)}, documents=${lastValidatedImportPackage?.documents.length ?? 'unknown'}`,
  );
  const importContext = {
    repositoryPath: repoPath(),
    outputDirectory: config.settings.outputDirectory,
    jobId,
    importPackage:
      lastValidatedFilePath === filePath ? (lastValidatedImportPackage ?? undefined) : undefined,
    sourceZipPath: filePath,
    log: (level: LogEntry['level'], message: string) => addLog(level, 'import', message),
    onProgress: (progress: number) => {
      jobQueue.updateStatus(jobId, 'running', progress);
      mainWindow?.webContents.send('kae:job-updated', jobQueue.getById(jobId)!);
    },
  };

  addLog('info', 'import', `Import started: ${fileName}`);
  const importResult = await importer.import(fileRef, importContext);

  if (!importResult.success || importResult.documents.length === 0) {
    const error = importResult.errors?.join('; ') || 'Import produced no documents';
    setStep(timeline, 'analyze-export', 'failed', error);
    jobQueue.updateStatus(jobId, 'failed', 100, error);
    addLog(
      'error',
      'import',
      `Import failed after snapshot — repository may be partially updated. Rollback: ${snapshotPath}. Error: ${error}`,
    );
    throw new Error(
      `Import failed. Snapshot available at ${snapshotPath}. What happened: connector produced no documents. Why: ${error}. Recovery: restore from snapshot if needed.`,
    );
  }
  setStep(timeline, 'analyze-export', 'complete', `${importResult.documents.length} documents`);
  setStep(timeline, 'generate-sources', 'running');

  jobQueue.updateStatus(jobId, 'running', 85);
  mainWindow?.webContents.send('kae:job-updated', jobQueue.getById(jobId)!);

  setStep(timeline, 'update-repository', 'running');
  const exportResult = await axiomExporter.export(importResult.documents, repoPath(), {
    log: (level, message) => addLog(level, 'export', message),
    onProgress: (progress) => {
      jobQueue.updateStatus(jobId, 'running', 85 + Math.round(progress * 0.15));
      mainWindow?.webContents.send('kae:job-updated', jobQueue.getById(jobId)!);
    },
    importFileName: fileName,
    sourceZipPath: filePath,
  });
  setStep(timeline, 'generate-sources', 'complete');
  setStep(timeline, 'update-repository', 'complete', `${exportResult.sourcesCreated} sources`);
  setStep(timeline, 'update-registries', 'complete', exportResult.reviewFile ?? 'Registries updated');

  setStep(timeline, 'health-check', 'running');
  const health = await checkRepositoryHealth(repoPath());
  setStep(timeline, 'health-check', 'complete', health.statusSubline);

  setStep(timeline, 'git-readiness', 'running');
  const gitReadiness = health.gitReadiness;
  setStep(timeline, 'git-readiness', 'complete', gitReadiness.status);

  const durationMs = Date.now() - started;
  const connector = importerRegistry.get(formatId);

  const summary: ImportSummary = {
    conversationsFound: importResult.summary?.conversationsFound ?? importResult.documents.length,
    sourcesCreated: exportResult.sourcesCreated,
    skippedDuplicates: exportResult.skippedDuplicates,
    errors: [...(importResult.errors ?? []), ...exportResult.errors],
    outputFolder: exportResult.outputFolder,
    createdSourceIds: exportResult.createdSourceIds,
    classified: exportResult.classified,
    uncertain: exportResult.uncertain,
    reviewFile: exportResult.reviewFile,
    durationMs,
    connectorId: formatId,
    connectorName: connector?.name ?? formatId,
    sessionsCreated: exportResult.sessionsCreated ?? exportResult.sourcesCreated,
    snapshotPath,
    gitReadiness,
    timeline: [...timeline],
  };

  const importReport: ImportReport = {
    reportId: jobId,
    generatedAt: new Date().toISOString(),
    durationMs,
    connectorId: formatId,
    connectorName: connector?.name ?? 'ChatGPT Connector',
    sourceFile: fileName,
    repositoryPath: repoPath(),
    imported: exportResult.sourcesCreated,
    updated: validationReport.estimatedSourcesToUpdate,
    skipped: exportResult.skippedDuplicates,
    warnings: validationReport.warnings,
    errors: summary.errors,
    sourcesCreated: exportResult.createdSourceIds,
    sessionsCreated: exportResult.sessionsCreated ?? exportResult.sourcesCreated,
    registriesUpdated: validationReport.diffPreview?.registriesUpdated ?? [],
    snapshotPath,
    manifestPath,
    gitReadiness,
    reportFilePath: '',
  };

  try {
    summary.importReportPath = await writeImportReport(repoPath(), importReport);
    addLog('info', 'import', `Import report saved: ${summary.importReportPath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    summary.errors.push(`Import report: ${msg}`);
    addLog('warn', 'import', `Could not write import report: ${msg}`);
  }

  setStep(timeline, 'complete', 'complete', `Done in ${(durationMs / 1000).toFixed(1)}s`);
  summary.timeline = [...timeline];

  lastImportSummary = summary;
  const completedJob = jobQueue.getById(jobId)!;
  completedJob.summary = summary;
  jobQueue.updateStatus(jobId, 'completed', 100);

  addLog(
    'info',
    'import',
    `Import complete in ${durationMs}ms: ${summary.sourcesCreated} source(s), ${summary.skippedDuplicates} skipped`,
    { summary, snapshotPath, manifestPath },
  );

  mainWindow?.webContents.send('kae:job-updated', jobQueue.getById(jobId)!);
  void rebuildExecutiveBriefingCache();
  mainWindow?.webContents.send('kae:import-complete', summary);
  return summary;
}

function setupIpc(): void {
  ipcMain.handle('kae:get-importers', () =>
    importerRegistry.getAll().map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      supportedExtensions: i.supportedExtensions,
    })),
  );

  ipcMain.handle('kae:get-repository-config', () => config.repository);
  ipcMain.handle('kae:set-repository-config', (_event, repo: RepositoryConfig) => {
    config.repository = repo;
    addLog('info', 'repository', `Repository path set to ${repo.path}`);
    return config.repository;
  });

  ipcMain.handle('kae:get-settings', () => config.settings);
  ipcMain.handle('kae:set-settings', (_event, settings: AppSettings) => {
    config.settings = settings;
    addLog('info', 'settings', 'Application settings updated');
    return config.settings;
  });

  ipcMain.handle('kae:get-jobs', () => jobQueue.getAll());
  ipcMain.handle('kae:get-logs', () => logs);
  ipcMain.handle('kae:get-default-repository-path', () => DEFAULT_REPOSITORY_PATH);

  ipcMain.handle('kae:get-repository-health', async () => checkRepositoryHealth(repoPath()));
  ipcMain.handle('kae:get-git-readiness', async () => {
    const health = await checkRepositoryHealth(repoPath());
    return health.gitReadiness;
  });
  ipcMain.handle('kae:get-repository-stats', async () => getRepositoryStats(repoPath()));
  ipcMain.handle('kae:browse-repository', async () => browseRepository(repoPath()));
  ipcMain.handle('kae:read-repository-file', async (_event, relativePath: string) =>
    readRepositoryFile(repoPath(), relativePath),
  );
  ipcMain.handle('kae:parse-chatgpt-source', async (_event, relativePath: string) => {
    const content = await readRepositoryFile(repoPath(), relativePath);
    const parsed = parseChatGptSourceMarkdown(content);
    if (!parsed) return null;

    const allRefs = new Set<string>(parsed.fileReferences);
    for (const msg of parsed.messages) {
      for (const ref of msg.fileReferences) allRefs.add(ref);
    }

    const assets = await resolveChatGptAssets(repoPath(), [...allRefs]);
    return { parsed, assets };
  });
  ipcMain.handle(
    'kae:read-repository-asset',
    async (_event, relativePath: string, refHint?: string) => {
      const full = resolveRepoFile(relativePath);
      const buffer = await fs.readFile(full);
      const mimeType = detectMimeType(buffer, refHint ?? path.basename(relativePath));
      const normalized = relativePath.replace(/\\/g, '/');
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(normalized)}`,
        mimeType,
        sizeBytes: buffer.length,
      };
    },
  );
  ipcMain.handle('kae:list-chatgpt-import-entries', async () =>
    listChatGptImportEntries(repoPath()),
  );
  ipcMain.handle('kae:search-repository', async (_event, query: string) =>
    searchRepository(repoPath(), query),
  );
  ipcMain.handle('kae:build-evidence-index', async () => {
    const index = await buildEvidenceIndex(repoPath());
    await buildRelationshipIndex(repoPath());
    void rebuildExecutiveBriefingCache();
    return summarizeEvidenceIndex(index);
  });
  ipcMain.handle('kae:search-knowledge', async (_event, query: string) => {
    const hits = await searchEvidence(repoPath(), query);
    return evidenceResultsToRepositoryResults(hits);
  });
  ipcMain.handle(
    'kae:resolve-evidence-drilldown',
    async (_event, recordId: string, query?: string) => getEvidenceDrilldown(repoPath(), recordId, query),
  );
  ipcMain.handle('kae:answer-knowledge-question', async (_event, question: string) =>
    answerKnowledgeQuestion(repoPath(), question),
  );
  ipcMain.handle('kae:build-relationship-index', async () => {
    const index = await buildRelationshipIndex(repoPath());
    void rebuildExecutiveBriefingCache();
    return summarizeRelationshipIndex(index);
  });
  ipcMain.handle('kae:search-relationships', async (_event, query: string) => {
    const index = await ensureRelationshipIndex(repoPath());
    return searchRelationships(index, query);
  });
  ipcMain.handle('kae:get-relationships-for-evidence', async (_event, evidenceId: string) => {
    const index = await ensureRelationshipIndex(repoPath());
    return getRelationshipsForEvidence(index, evidenceId);
  });
  ipcMain.handle(
    'kae:get-related-evidence',
    async (_event, anchor: string, query?: string) => getRelatedEvidence(repoPath(), anchor, query),
  );
  ipcMain.handle('kae:get-executive-briefing', async () => getExecutiveBriefing(repoPath()));
  ipcMain.handle('kae:refresh-executive-briefing', async () =>
    refreshExecutiveBriefing(repoPath()),
  );
  ipcMain.handle('kae:open-repository-path', async () => {
    await shell.openPath(repoPath());
  });
  ipcMain.handle('kae:open-repository-file', async (_event, relativePath: string) => {
    await shell.openPath(resolveRepoFile(relativePath));
  });
  ipcMain.handle('kae:reveal-repository-file', async (_event, relativePath: string) => {
    shell.showItemInFolder(resolveRepoFile(relativePath));
  });
  ipcMain.handle('kae:copy-text', async (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });
  ipcMain.handle('kae:get-last-validation', () => lastValidationReport);
  ipcMain.handle('kae:get-last-import-summary', () => lastImportSummary);
  ipcMain.handle('kae:get-last-repair-plan', () => lastRepairPlan);
  ipcMain.handle('kae:get-last-repair-result', () => lastRepairResult);

  ipcMain.handle('kae:select-zip-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select ChatGPT Export ZIP',
      properties: ['openFile'],
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle('kae:analyze-repository-repair', async () => {
    addLog('info', 'repair', 'Repository repair analysis started (read-only)');
    const plan = await generateRepairPlan(repoPath());
    lastRepairPlan = plan;
    lastRepairResult = null;
    addLog('info', 'repair', `Repair analysis complete: ${plan.issues.length} issue(s), ${plan.autoRepairCount} auto-repair action(s)`, {
      issueCount: plan.issues.length,
      autoRepairCount: plan.autoRepairCount,
      manualReviewCount: plan.manualReviewCount,
    });
    return plan;
  });

  ipcMain.handle('kae:execute-repository-repair', async (_event, plan: RepairPlan) => {
    addLog('info', 'repair', `Repository repair confirmed — ${plan.autoRepairCount} safe action(s) will be applied`);
    const result = await executeRepairPlan(plan, {
      log: (level, message, context) => addLog(level, 'repair', message, context),
    });
    lastRepairResult = result;
    lastRepairPlan = plan;
    addLog('info', 'repair', `Repository repair complete: ${result.filesChanged.length} file(s) changed`, {
      snapshotPath: result.snapshotPath,
      duplicatesBefore: result.healthBefore.duplicateIds,
      duplicatesAfter: result.healthAfter.duplicateIds,
      ready: result.healthAfter.ready,
    });
    return result;
  });

  ipcMain.handle('kae:validate-chatgpt-zip', async (_event, filePath: string) => {
    if (!filePath || !filePath.toLowerCase().endsWith('.zip')) {
      throw new Error('Please select a valid .zip file. Repository unchanged.');
    }
    return validateImport(filePath);
  });

  ipcMain.handle('kae:cancel-validation', () => {
    if (activeValidationAbort) {
      activeValidationAbort.abort();
      addLog('warn', 'import', 'Validation cancelled by user — repository unchanged');
      emitValidationProgress({
        status: 'cancelled',
        stage: 'cancelled',
        stageLabel: 'Validation cancelled',
        conversationsTotal: 0,
        conversationsProcessed: 0,
        messagesProcessed: 0,
        warningsGenerated: 0,
        startedAt: new Date().toISOString(),
        elapsedMs: 0,
        detail: 'Cancelled by user',
        error: 'Validation cancelled by user.',
      });
      return true;
    }
    return false;
  });

  ipcMain.handle('kae:import-chatgpt-zip', async (_event, filePath: string) => {
    if (!filePath || !filePath.toLowerCase().endsWith('.zip')) {
      throw new Error('Please select a valid .zip file. Repository unchanged.');
    }
    return runImport(filePath, 'chatgpt-export-zip');
  });
}

app.whenReady().then(async () => {
  protocol.handle('kae-asset', async (request) => {
    const relativePath = parseKaeAssetRequestUrl(request.url);
    const full = resolveRepoFile(relativePath);
    const buffer = await fs.readFile(full);
    const mimeType = detectMimeType(buffer, path.basename(relativePath));
    return new Response(buffer, { headers: { 'Content-Type': mimeType } });
  });

  registerPlugins();
  setupIpc();
  addLog('info', 'system', `${APP_NAME} started — ${APP_FULL_NAME}`);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

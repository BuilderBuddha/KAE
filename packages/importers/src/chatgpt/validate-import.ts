import type {
  FileReference,
  ImportPackage,
  ImportValidationReport,
  LogLevel,
  ValidationProgress,
} from '@scooper/core';
import { buildFailedValidationReport, planAxiomImport } from '@scooper/exporters';
import { runChatGptValidationPipeline } from './validation-pipeline.js';

export interface ValidationOptions {
  log?: (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) => void;
  onProgress?: (progress: ValidationProgress) => void;
  onImportPackageReady?: (importPackage: ImportPackage) => void;
  signal?: AbortSignal;
}

/** Validates a ChatGPT export ZIP without writing to the repository. */
export async function validateChatGptZipImport(
  file: FileReference,
  repositoryPath: string,
  options: ValidationOptions = {},
): Promise<ImportValidationReport> {
  const started = Date.now();
  const warnings: string[] = [];

  const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void => {
    options.log?.(level, message, context);
  };

  try {
    log('info', 'Validation started (read-only — repository will not be modified)', {
      fileName: file.name,
      repositoryPath,
    });

    const importPackage = await runChatGptValidationPipeline(file, {
      log: options.log,
      onProgress: options.onProgress,
      signal: options.signal,
    });
    options.onImportPackageReady?.(importPackage);

    options.onProgress?.({
      status: 'running',
      stage: 'planning-import',
      stageLabel: 'Planning import (read-only)',
      fileName: file.name,
      conversationsTotal: importPackage.documents.length,
      conversationsProcessed: importPackage.documents.length,
      messagesProcessed: importPackage.documents.reduce(
        (sum, doc) => sum + Number(doc.metadata.messageCount ?? 0),
        0,
      ),
      warningsGenerated: warnings.length,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      detail: 'Scanning repository for planned changes',
    });
    log('info', 'Planning import (read-only repository scan)…');

    const report = await planAxiomImport(
      importPackage.documents,
      repositoryPath,
      file.name,
    );
    report.filePath = file.path;
    report.zipReadable = true;
    report.chatGptStructureDetected = true;
    report.conversationsJsonPresent = true;
    report.valid = report.blockingErrors.length === 0 && importPackage.documents.length > 0;
    report.validatedAt = new Date().toISOString();
    report.durationMs = Date.now() - started;

    if (importPackage.documents.length === 0) {
      const msg = 'No conversations found in export.';
      report.errors.push(msg);
      report.blockingErrors.push(msg);
      report.valid = false;
    }

    if (report.uncertainCount > 0) {
      const warning = `${report.uncertainCount} conversation(s) classified as uncertain and will route to Other / Review Needed.`;
      report.warnings.push(warning);
      warnings.push(warning);
    }

    if (report.estimatedDuplicatesSkipped > 0) {
      const warning = `${report.estimatedDuplicatesSkipped} duplicate(s) will be skipped during import.`;
      report.warnings.push(warning);
      warnings.push(warning);
    }

    if (warnings.length > 0) {
      log('warn', `Validation warnings: ${warnings.length}`, { warnings });
    }

    options.onProgress?.({
      status: report.valid ? 'complete' : 'failed',
      stage: report.valid ? 'completed' : 'failed',
      stageLabel: report.valid ? 'Validation complete' : 'Validation failed',
      fileName: file.name,
      conversationsTotal: report.conversationsFound,
      conversationsProcessed: report.conversationsFound,
      messagesProcessed: importPackage.documents.reduce(
        (sum, doc) => sum + Number(doc.metadata.messageCount ?? 0),
        0,
      ),
      warningsGenerated: report.warnings.length,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      detail: report.valid
        ? `${report.conversationsFound} conversations ready for review`
        : report.blockingErrors.join('; ') || 'Validation failed',
      error: report.valid ? undefined : report.blockingErrors.join('; ') || 'Validation failed',
    });

    if (report.valid) {
      log('info', `Validation completed successfully in ${report.durationMs}ms`, {
        conversationsFound: report.conversationsFound,
        estimatedSourcesToCreate: report.estimatedSourcesToCreate,
        estimatedSourcesToUpdate: report.estimatedSourcesToUpdate,
        warnings: report.warnings.length,
      });
    } else {
      log('error', `Validation failed — repository unchanged. ${report.blockingErrors.join('; ')}`, {
        blockingErrors: report.blockingErrors,
        errors: report.errors,
      });
    }

    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cancelled = message.includes('cancelled');
    const report = buildFailedValidationReport(file.name, file.path, repositoryPath, message);
    report.durationMs = Date.now() - started;
    report.validatedAt = new Date().toISOString();

    options.onProgress?.({
      status: cancelled ? 'cancelled' : 'failed',
      stage: cancelled ? 'cancelled' : 'failed',
      stageLabel: cancelled ? 'Validation cancelled' : 'Validation failed',
      fileName: file.name,
      conversationsTotal: 0,
      conversationsProcessed: 0,
      messagesProcessed: 0,
      warningsGenerated: 0,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      error: message,
      detail: message,
    });

    log(
      cancelled ? 'warn' : 'error',
      `Validation ${cancelled ? 'cancelled' : 'failed'} — repository unchanged. ${message}`,
      { error: message },
    );

    return report;
  }
}

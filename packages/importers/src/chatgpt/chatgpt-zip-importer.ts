import type { FileReference, ImportContext, ImportResult } from '@scooper/core';
import { BaseImporter } from '../registry.js';
import { runChatGptValidationPipeline } from './validation-pipeline.js';

export class ChatGptExportZipImporter extends BaseImporter {
  readonly id = 'chatgpt-export-zip' as const;
  readonly name = 'ChatGPT Connector';
  readonly description =
    'Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.';
  readonly supportedExtensions = ['.zip'] as const;

  async import(file: FileReference, context: ImportContext): Promise<ImportResult> {
    const jobId = context.jobId ?? crypto.randomUUID();
    const errors: string[] = [];

    if (context.importPackage) {
      context.log?.(
        'info',
        `Using validated import package: ${context.importPackage.documents.length} document(s) — no ZIP re-parse`,
      );
      return {
        jobId,
        success: true,
        documents: context.importPackage.documents,
        errors,
        summary: {
          conversationsFound: context.importPackage.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: [],
        },
      };
    }

    context.log?.('info', `Starting memory-safe ChatGPT import: ${file.name}`);

    try {
      const importPackage = await runChatGptValidationPipeline(file, {
        log: (level, message) => context.log?.(level, message),
        onProgress: (progress) => {
          if (progress.conversationsTotal > 0) {
            const pct = Math.round(
              (progress.conversationsProcessed / progress.conversationsTotal) * 100,
            );
            context.onProgress?.(pct);
          }
        },
        signal: context.signal,
      });

      context.log?.(
        'info',
        `Import package ready: ${importPackage.documents.length} document(s)`,
      );

      return {
        jobId,
        success: true,
        documents: importPackage.documents,
        errors,
        summary: {
          conversationsFound: importPackage.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: [],
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      context.log?.('error', message);
      return {
        jobId,
        success: false,
        documents: [],
        errors,
        summary: {
          conversationsFound: 0,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: [],
        },
      };
    }
  }
}

export const chatGptExportZipImporter = new ChatGptExportZipImporter();

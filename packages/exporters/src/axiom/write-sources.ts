import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { ExportContext, ExportResult, ImportReviewEntry, ParsedDocument } from '@scooper/core';
import { classifyConversation, classifyConversationBatch } from '@scooper/capability-engine';
import {
  ensureRepositoryDirs,
  findHighestKrcNumber,
  formatKrcId,
  loadExistingConversationMap,
  safeWriteBinaryFile,
  safeWriteFile,
} from './krc-utils.js';
import {
  buildExecutiveSessionFilename,
  buildExecutiveSessionMarkdown,
} from './executive-session.js';
import type { ImportReviewBatch } from './import-review.js';
import { appendSourceRegistry, buildRegistryEntry, updateKrcStatus } from './registry-updater.js';
import {
  buildSourceFilename,
  buildSourceMarkdown,
  isYouTubeSourceDocument,
  resolveCategoryFolder,
} from './source-markdown.js';
import { appendImportReview } from './write-import-review.js';

interface ZipAssetMeta {
  zipPath: string;
  fileName: string;
  dataBase64?: string;
}

function loadAssetsFromZip(
  zipPath: string,
  refs: Array<{ zipPath: string; fileName: string }>,
): Map<string, Buffer> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const entryByPath = new Map<string, (typeof entries)[0]>();

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    entryByPath.set(entry.entryName.replace(/\\/g, '/'), entry);
  }

  const loaded = new Map<string, Buffer>();
  for (const ref of refs) {
    const entry = entryByPath.get(ref.zipPath);
    if (entry) loaded.set(ref.zipPath, entry.getData());
  }
  return loaded;
}

/** Writes parsed documents to the Axiom Knowledge Repository. */
export async function writeAxiomSources(
  documents: ParsedDocument[],
  repositoryPath: string,
  context?: ExportContext,
): Promise<ExportResult> {
  const errors: string[] = [];
  const createdSourceIds: string[] = [];
  let sourcesCreated = 0;
  let sessionsCreated = 0;
  let skippedDuplicates = 0;
  let classified = 0;
  let uncertain = 0;

  await ensureRepositoryDirs(repositoryPath);

  const classifications = classifyConversationBatch(documents);
  for (const doc of documents) {
    const convId = String(doc.metadata.conversationId ?? doc.id);
    doc.metadata.classification = classifications.get(convId);
  }

  let nextKrcNum = (await findHighestKrcNumber(repositoryPath)) + 1;
  const existingConversations = await loadExistingConversationMap(repositoryPath);
  const newRegistryEntries: ReturnType<typeof buildRegistryEntry>[] = [];
  const importBatchLabel = `KAE Import — ${new Date().toISOString().slice(0, 10)}`;
  const batchUploadDir = path.join(
    repositoryPath,
    'Uploads',
    `chatgpt-import-${new Date().toISOString().replace(/[:.]/g, '-')}`,
  );
  let assetsWritten = false;

  const reviewBatch: ImportReviewBatch = {
    importDate: new Date().toISOString(),
    importFileName: context?.importFileName ?? 'unknown.zip',
    conversationsProcessed: documents.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: [],
  };

  const total = documents.length;
  let processed = 0;

  for (const doc of documents) {
    processed++;
    context?.onProgress?.(Math.round((processed / total) * 100));

    const conversationId = String(doc.metadata.conversationId ?? doc.id);
    const classification =
      classifications.get(conversationId) ?? classifyConversation(doc);
    doc.metadata.classification = classification;

    const existingKrcId = existingConversations.get(conversationId);
    const categoryFolder = resolveCategoryFolder(classification);

    let krcId: string;
    let overwrite: boolean;

    if (existingKrcId) {
      krcId = existingKrcId;
      overwrite = true;
      context?.log?.('info', `Updating existing source ${krcId} for conversation ${conversationId}`);
    } else {
      krcId = formatKrcId(nextKrcNum);
      nextKrcNum++;
      overwrite = false;
    }

    const filename = buildSourceFilename(krcId, doc);
    const sourcePath = path.join(repositoryPath, 'Sources', categoryFolder, filename);
    const sourceRelativePath = `Sources/${categoryFolder}/${filename}`;
    const markdown = buildSourceMarkdown(krcId, doc, classification);
    const youtubeSource = isYouTubeSourceDocument(doc);

    const reviewEntry: ImportReviewEntry = {
      krcId,
      conversationId,
      title: doc.title,
      primaryCategory: classification.primaryCategory,
      categories: classification.categories,
      confidence: classification.confidence,
      uncertain: classification.uncertain,
      status: 'classified',
      sourcePath: sourceRelativePath,
    };

    try {
      const result = await safeWriteFile(sourcePath, markdown, overwrite);

      if (result === 'skipped') {
        skippedDuplicates++;
        reviewEntry.status = 'skipped';
        reviewEntry.notes = 'Duplicate file — not overwritten';
        reviewBatch.skipped.push(reviewEntry);
        context?.log?.('warn', `Skipped duplicate file: ${filename}`);
        continue;
      }

      existingConversations.set(conversationId, krcId);

      if (result === 'created') {
        sourcesCreated++;
        createdSourceIds.push(krcId);
        newRegistryEntries.push(
          buildRegistryEntry(
            krcId,
            doc.title,
            markdown,
            classification.uncertain ? 'Review Needed' : classification.primaryCategory,
          ),
        );
      } else if (result === 'updated') {
        reviewEntry.status = 'updated';
      }

      // YouTube sources inventory evidence only — no ChatGPT-shaped Executive Session twin.
      if (!youtubeSource) {
        const sessionFilename = buildExecutiveSessionFilename(krcId, doc);
        const sessionPath = path.join(
          repositoryPath,
          'ExecutiveSessions',
          categoryFolder,
          sessionFilename,
        );
        const sessionRelativePath = `ExecutiveSessions/${categoryFolder}/${sessionFilename}`;
        const sessionMarkdown = buildExecutiveSessionMarkdown(
          krcId,
          doc,
          classification,
          sourceRelativePath,
        );
        await safeWriteFile(sessionPath, sessionMarkdown, overwrite);
        sessionsCreated++;
        reviewEntry.sessionPath = sessionRelativePath;
        context?.log?.('info', `Executive session: ${sessionRelativePath}`);
      }

      if (classification.uncertain) {
        uncertain++;
        reviewEntry.status = reviewEntry.status === 'updated' ? 'updated' : 'uncertain';
        reviewBatch.uncertain.push(reviewEntry);
      } else {
        classified++;
        reviewBatch.classified.push(reviewEntry);
      }

      context?.log?.(
        'info',
        `${result === 'created' ? 'Created' : 'Updated'} [${classification.primaryCategory}] ${krcId}: ${sourceRelativePath}`,
      );

      if (!assetsWritten) {
        await writeBatchAssets(batchUploadDir, doc, context);
        assetsWritten = true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${krcId}: ${message}`);
      reviewEntry.status = 'error';
      reviewEntry.notes = message;
      reviewBatch.errors.push(reviewEntry);
      context?.log?.('error', `Failed to write ${krcId}: ${message}`);
    }
  }

  let reviewFile: string | undefined;
  try {
    if (newRegistryEntries.length > 0) {
      await appendSourceRegistry(repositoryPath, newRegistryEntries);
    }
    await updateKrcStatus(repositoryPath, newRegistryEntries.length, importBatchLabel);
    reviewFile = await appendImportReview(repositoryPath, reviewBatch);
    context?.log?.('info', `Import review written: ${reviewFile}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Registry/review update: ${message}`);
    context?.log?.('error', message);
  }

  const outputFolder = path.join(repositoryPath, 'Sources');
  return {
    sourcesCreated,
    sessionsCreated,
    skippedDuplicates,
    errors,
    outputFolder,
    createdSourceIds,
    classified,
    uncertain,
    reviewFile,
  };
}

async function writeBatchAssets(
  uploadDir: string,
  doc: ParsedDocument,
  context?: ExportContext,
): Promise<void> {
  const assets = doc.metadata.allZipAssets as ZipAssetMeta[] | undefined;
  if (!Array.isArray(assets) || assets.length === 0) return;

  await fs.mkdir(uploadDir, { recursive: true });

  const needsZipLoad = assets.some((a) => !a.dataBase64);
  let zipBuffers: Map<string, Buffer> | undefined;
  if (needsZipLoad && context?.sourceZipPath) {
    context.log?.('info', `Extracting ${assets.length} asset(s) from ZIP at write time`);
    zipBuffers = loadAssetsFromZip(context.sourceZipPath, assets);
  }

  for (const asset of assets) {
    const data = asset.dataBase64
      ? Buffer.from(asset.dataBase64, 'base64')
      : zipBuffers?.get(asset.zipPath);
    if (!data || !asset.fileName) continue;
    const destPath = path.join(uploadDir, asset.fileName);
    const result = await safeWriteBinaryFile(destPath, data, false);
    if (result !== 'skipped') {
      context?.log?.('info', `Preserved asset: Uploads/${path.basename(uploadDir)}/${asset.fileName}`);
    }
  }
}

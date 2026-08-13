import type { ImportValidationReport, ParsedDocument } from '@scooper/core';
import { classifyConversation, classifyConversationBatch } from '@scooper/capability-engine';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  findHighestKrcNumber,
  formatKrcId,
  loadExistingConversationMap,
} from './krc-utils.js';
import { buildExecutiveSessionFilename } from './executive-session.js';
import { buildSourceFilename, isYouTubeSourceDocument, resolveCategoryFolder } from './source-markdown.js';
import { buildImportDiffPreview } from './build-diff-preview.js';

interface ZipAssetMeta {
  zipPath: string;
  fileName: string;
}

/** Read-only import plan — no repository writes. */
export async function planAxiomImport(
  documents: ParsedDocument[],
  repositoryPath: string,
  importFileName: string,
): Promise<ImportValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockingErrors: string[] = [];
  const plannedRecords: ImportValidationReport['plannedRecords'] = [];

  let estimatedSourcesToCreate = 0;
  let estimatedSourcesToUpdate = 0;
  let estimatedDuplicatesSkipped = 0;
  let uncertainCount = 0;

  const classifications = classifyConversationBatch(documents);
  let nextKrcNum = (await findHighestKrcNumber(repositoryPath)) + 1;
  const existingConversations = await loadExistingConversationMap(repositoryPath);

  const sourcesRoot = path.join(repositoryPath, 'Sources');
  const uploadsPattern = path.join(repositoryPath, 'Uploads', 'chatgpt-import-{timestamp}');
  const executiveSessionsRoot = path.join(repositoryPath, 'ExecutiveSessions');
  const registryPath = path.join(repositoryPath, 'Registries', 'SOURCE_REGISTRY.md');
  const reviewPath = path.join(repositoryPath, 'Registries', 'IMPORT_REVIEW.md');

  let uploadedFilesCount = 0;
  const uploadedFileNames: string[] = [];
  const firstDoc = documents[0];
  if (firstDoc) {
    const assets = firstDoc.metadata.allZipAssets as ZipAssetMeta[] | undefined;
    if (Array.isArray(assets)) {
      uploadedFilesCount = assets.length;
      uploadedFileNames.push(...assets.map((a) => a.fileName).filter(Boolean));
    }
  }

  for (const doc of documents) {
    const conversationId = String(doc.metadata.conversationId ?? doc.id);
    const classification =
      classifications.get(conversationId) ?? classifyConversation(doc);
    const existingKrcId = existingConversations.get(conversationId);
    const categoryFolder = resolveCategoryFolder(classification);

    let krcId: string;
    let action: 'create' | 'update' | 'skip';

    if (existingKrcId) {
      krcId = existingKrcId;
      action = 'update';
    } else {
      krcId = formatKrcId(nextKrcNum);
      nextKrcNum++;
      action = 'create';
    }

    const filename = buildSourceFilename(krcId, doc);
    const sourcePath = path.join(sourcesRoot, categoryFolder, filename);
    const sourceRelativePath = `Sources/${categoryFolder}/${filename}`;
    const youtubeSource = isYouTubeSourceDocument(doc);
    const sessionFilename = buildExecutiveSessionFilename(krcId, doc);
    const sessionRelativePath = youtubeSource
      ? ''
      : `ExecutiveSessions/${categoryFolder}/${sessionFilename}`;

    if (action === 'create') {
      try {
        await fs.access(sourcePath);
        action = 'skip';
      } catch {
        // path available
      }
    }

    if (action === 'create') estimatedSourcesToCreate++;
    else if (action === 'update') estimatedSourcesToUpdate++;
    else if (action === 'skip') estimatedDuplicatesSkipped++;

    if (classification.uncertain) uncertainCount++;

    plannedRecords.push({
      conversationId,
      title: doc.title,
      krcId,
      action,
      primaryCategory: classification.primaryCategory,
      categories: classification.categories,
      uncertain: classification.uncertain,
      sourcePath: sourceRelativePath,
      sessionPath: sessionRelativePath,
    });
  }

  if (uncertainCount > 0) {
    warnings.push(
      `${uncertainCount} conversation(s) require manual review (uncertain classification).`,
    );
  }

  if (estimatedDuplicatesSkipped > 0) {
    warnings.push(`${estimatedDuplicatesSkipped} file(s) already exist and will be skipped.`);
  }

  try {
    await fs.access(repositoryPath);
  } catch {
    warnings.push('Repository path does not exist yet — it will be created on import.');
  }

  const valid = blockingErrors.length === 0 && documents.length > 0;
  const diffPreview = buildImportDiffPreview(plannedRecords, uploadsPattern);

  return {
    valid,
    fileName: importFileName,
    filePath: '',
    zipReadable: true,
    chatGptStructureDetected: true,
    conversationsJsonPresent: true,
    conversationsFound: documents.length,
    uploadedFilesCount,
    uploadedFileNames,
    estimatedSourcesToCreate,
    estimatedSourcesToUpdate,
    estimatedDuplicatesSkipped,
    uncertainCount,
    errors,
    warnings,
    blockingErrors,
    plannedRecords,
    diffPreview,
    validatedAt: new Date().toISOString(),
    outputLocations: {
      sourcesRoot,
      uploadsPattern,
      executiveSessionsRoot,
      registryPath,
      reviewPath,
    },
    repositoryPath,
  };
}

/** Builds a failed validation report from a parse error. */
export function buildFailedValidationReport(
  fileName: string,
  filePath: string,
  repositoryPath: string,
  error: string,
): ImportValidationReport {
  return {
    valid: false,
    fileName,
    filePath,
    zipReadable: false,
    chatGptStructureDetected: false,
    conversationsJsonPresent: false,
    conversationsFound: 0,
    uploadedFilesCount: 0,
    uploadedFileNames: [],
    estimatedSourcesToCreate: 0,
    estimatedSourcesToUpdate: 0,
    estimatedDuplicatesSkipped: 0,
    uncertainCount: 0,
    errors: [error],
    warnings: [],
    blockingErrors: [error],
    plannedRecords: [],
    diffPreview: buildImportDiffPreview([], path.join(repositoryPath, 'Uploads', 'chatgpt-import-{timestamp}')),
    validatedAt: new Date().toISOString(),
    outputLocations: {
      sourcesRoot: path.join(repositoryPath, 'Sources'),
      uploadsPattern: path.join(repositoryPath, 'Uploads', 'chatgpt-import-{timestamp}'),
      executiveSessionsRoot: path.join(repositoryPath, 'ExecutiveSessions'),
      registryPath: path.join(repositoryPath, 'Registries', 'SOURCE_REGISTRY.md'),
      reviewPath: path.join(repositoryPath, 'Registries', 'IMPORT_REVIEW.md'),
    },
    repositoryPath,
  };
}

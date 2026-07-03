import fs from 'node:fs/promises';
import path from 'node:path';
import type { ImportReviewBatch } from './import-review.js';
import { buildImportReviewHeader, buildImportReviewSection } from './import-review.js';

/** Appends an import review batch to Registries/IMPORT_REVIEW.md. */
export async function appendImportReview(
  repositoryPath: string,
  batch: ImportReviewBatch,
): Promise<string> {
  const reviewPath = path.join(repositoryPath, 'Registries', 'IMPORT_REVIEW.md');
  let content: string;

  try {
    content = await fs.readFile(reviewPath, 'utf8');
  } catch {
    content = buildImportReviewHeader();
  }

  content = content.trimEnd() + '\n\n' + buildImportReviewSection(batch);
  await fs.writeFile(reviewPath, content, 'utf8');
  return reviewPath;
}

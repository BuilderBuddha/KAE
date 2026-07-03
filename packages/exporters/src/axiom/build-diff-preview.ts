import type { ImportDiffPreview, ImportPlannedRecord } from '@scooper/core';

const DEFAULT_REGISTRIES = [
  'Registries/SOURCE_REGISTRY.md',
  'Registries/KRC_STATUS.md',
  'Registries/IMPORT_REVIEW.md',
];

/** Builds a read-only diff preview from planned import records. */
export function buildImportDiffPreview(
  plannedRecords: ImportPlannedRecord[],
  uploadsPattern: string,
): ImportDiffPreview {
  const sourcesAdded: string[] = [];
  const sourcesUpdated: string[] = [];
  const sessionsAdded: string[] = [];
  const sessionsUpdated: string[] = [];
  const duplicatesSkipped: string[] = [];

  for (const record of plannedRecords) {
    if (record.action === 'create') {
      sourcesAdded.push(record.sourcePath);
      sessionsAdded.push(record.sessionPath);
    } else if (record.action === 'update') {
      sourcesUpdated.push(record.sourcePath);
      sessionsUpdated.push(record.sessionPath);
    } else if (record.action === 'skip') {
      duplicatesSkipped.push(record.sourcePath);
    }
  }

  const hasChanges = sourcesAdded.length + sourcesUpdated.length > 0;
  const registriesUpdated = hasChanges ? [...DEFAULT_REGISTRIES] : [];
  const uploadsAdded = hasChanges ? [uploadsPattern.replace('{timestamp}', '<timestamp>')] : [];
  const modifiedFiles = [...sourcesAdded, ...sourcesUpdated, ...sessionsAdded, ...sessionsUpdated];

  return {
    sourcesAdded,
    sourcesUpdated,
    sessionsAdded,
    sessionsUpdated,
    registriesUpdated,
    uploadsAdded,
    duplicatesSkipped,
    modifiedFiles,
    deletedFiles: [],
    estimatedTotalChanges:
      sourcesAdded.length +
      sourcesUpdated.length +
      sessionsAdded.length +
      sessionsUpdated.length +
      registriesUpdated.length +
      uploadsAdded.length,
  };
}

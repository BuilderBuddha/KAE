import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatGptExportZipImporter } from '@scooper/importers';
import { axiomExporter } from '@scooper/exporters';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zipPath = path.join(__dirname, '..', 'test-data', 'chatgpt-export-test.zip');
const repositoryPath = 'C:\\Users\\alber\\Axiom-Knowledge';

const importResult = await chatGptExportZipImporter.import(
  { path: zipPath, name: 'chatgpt-export-test.zip', extension: '.zip' },
  {
    repositoryPath,
    outputDirectory: './output',
    jobId: 'test-job',
    log: (level, msg) => console.log(`[${level}] ${msg}`),
  },
);

console.log('Import:', importResult.success, importResult.summary);

if (importResult.documents.length > 0) {
  const exportResult = await axiomExporter.export(importResult.documents, repositoryPath, {
    log: (level, msg) => console.log(`[${level}] ${msg}`),
  });
  console.log('Export:', exportResult);
}

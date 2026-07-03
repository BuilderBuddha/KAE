import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateChatGptZipImport } from '@scooper/importers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zipPath = path.join(__dirname, '..', 'test-data', 'chatgpt-export-test.zip');
const repositoryPath = process.env.SCOOPER_TEST_REPO ?? 'C:\\Users\\alber\\Axiom-Knowledge';

const report = await validateChatGptZipImport(
  { path: zipPath, name: 'chatgpt-export-test.zip', extension: '.zip' },
  repositoryPath,
);

console.log(JSON.stringify(report, null, 2));
console.log('\nValidation-only: no repository writes performed.');

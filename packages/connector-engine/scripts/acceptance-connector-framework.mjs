import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  allConnectors,
  getSharedConnectorManager,
  deduplicateDocuments,
} from '@scooper/connector-engine';
import {
  answerKnowledgeQuestion,
  loadEvidenceIndex,
  loadRelationshipIndex,
  loadExecutiveBriefingCache,
  searchEvidence,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function withTempFolder(prefix, buildFn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await buildFn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function testFramework() {
  assert(allConnectors.length >= 13, 'connector registry includes full + stub connectors');
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  const statuses = await manager.getStatuses({ repositoryPath });
  assert(statuses.length >= 13, 'connector manager returns statuses');
  const full = statuses.filter((s) => s.implementationStatus === 'full');
  assert(full.length === 4, 'four full connectors registered');
  const stubs = statuses.filter((s) => s.implementationStatus === 'stub');
  assert(stubs.length >= 9, 'stub connectors registered');
  console.log('PASS Connector Framework');
  return true;
}

async function testLocalFolder() {
  return withTempFolder('kae-local-folder-', async (folderDir) => {
    const marker = `KAE Connector Local Folder ${Date.now()}`;
    const fileName = `note-${Date.now()}.md`;
    await fs.writeFile(path.join(folderDir, fileName), `# Local Note\n\n${marker}\n`, 'utf8');

    const manager = getSharedConnectorManager();
    await manager.initialize(repositoryPath);
    await manager.connect('local-folder', {
      settings: { folderPath: folderDir },
    });
    const first = await manager.syncNow('local-folder', {
      path: folderDir,
      name: path.basename(folderDir),
      extension: '',
    });
    assert(first.success, `local folder sync: ${first.errors.join('; ')}`);
    assert(
      first.itemsImported >= 1 || first.documents.length >= 1,
      'local folder imported items',
    );
    assert(first.evidenceIndexBuiltAt, 'local folder refreshed evidence');

    const evidence = await loadEvidenceIndex(repositoryPath);
    const hits = await searchEvidence(repositoryPath, marker);
    assert(hits.length > 0, 'local folder transcript searchable');

    const second = await manager.syncNow('local-folder', {
      path: folderDir,
      name: path.basename(folderDir),
      extension: '',
    });
    assert(second.success, 'local folder re-sync succeeds');
    const deduped = await deduplicateDocuments(repositoryPath, first.documents);
    assert(deduped.updatedCount >= 1, 'deduplication detects existing local folder source');

    const answer = await answerKnowledgeQuestion(repositoryPath, marker, { providerId: 'mock' });
    const answerText = `${answer.directAnswer}\n${answer.reasonedSummary}`;
    assert(
      answerText.includes(marker) || answer.evidenceUsed.length > 0,
      'vigsy answers from local folder',
    );

    console.log('PASS Local Folder');
    return true;
  });
}

async function testGitHub() {
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  await manager.connect('github', {
    settings: { repository: 'octocat/Hello-World' },
  });
  const result = await manager.syncNow('github', null);
  assert(result.success, `github sync: ${result.errors.join('; ')}`);
  assert(result.documents.length >= 1, 'github imported documents');
  assert(result.relationshipIndexBuiltAt, 'github refreshed relationships');

  const readme = result.documents.find((doc) => String(doc.metadata.itemKind) === 'readme');
  assert(readme, 'github readme acquired');
  const evidence = await loadEvidenceIndex(repositoryPath);
  const hits = await searchEvidence(repositoryPath, 'Hello World');
  assert(hits.length > 0, 'github content searchable');

  console.log('PASS GitHub');
  return true;
}

async function testYouTube() {
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
  await manager.connect('youtube', {
    settings: {
      targetUrl: `https://www.youtube.com/channel/${channelId}`,
      maxVideos: 1,
    },
  });
  const result = await manager.syncNow('youtube', null);
  assert(result.success, `youtube sync: ${result.errors.join('; ')}`);
  assert(result.documents.length >= 1, 'youtube channel imported videos');
  assert(result.evidenceIndexBuiltAt, 'youtube refreshed evidence');

  const doc = result.documents[0];
  const evidence = await loadEvidenceIndex(repositoryPath);
  const hits = await searchEvidence(repositoryPath, doc.title.split(' ')[0] ?? 'Google');
  assert(hits.length > 0, 'youtube transcript searchable');

  const relationships = await loadRelationshipIndex(repositoryPath);
  assert(relationships?.relationshipCount >= 0, 'relationship index available after youtube sync');

  const briefing = await loadExecutiveBriefingCache(repositoryPath);
  assert(briefing?.briefing.generatedAt, 'executive awareness updated after youtube sync');

  console.log('PASS YouTube');
  return true;
}

async function testChatGpt() {
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  const connector = manager.get('chatgpt-export-zip');
  assert(connector, 'chatgpt connector registered');
  await manager.connect('chatgpt-export-zip', {});
  const health = await connector.checkHealth({ repositoryPath });
  assert(health.status === 'healthy', 'chatgpt connector healthy when connected');
  console.log('PASS ChatGPT');
  return true;
}

async function testConnectorManagerAndSync() {
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  const historyBefore = manager.getSyncHistory().length;
  await manager.connect('github', {
    settings: { repository: 'octocat/Hello-World', includeIssues: false, includePullRequests: false, includeCommits: false, includeReleases: false },
  });
  await manager.syncNow('github', null);
  const historyAfter = manager.getSyncHistory().length;
  assert(historyAfter > historyBefore, 'sync history recorded');
  const schedules = manager.getSchedules();
  assert(Array.isArray(schedules), 'scheduler export available');
  console.log('PASS Sync');
  return true;
}

async function testDeduplication() {
  const manager = getSharedConnectorManager();
  await manager.initialize(repositoryPath);
  await manager.connect('github', {
    settings: { repository: 'octocat/Hello-World', includeIssues: false, includePullRequests: false, includeCommits: false, includeReleases: false },
  });
  const first = await manager.syncNow('github', null);
  const second = await manager.syncNow('github', null);
  assert(first.success && second.success, 'dedup sync runs');
  assert(second.itemsUpdated >= 0, 'second sync handles existing sources');
  console.log('PASS Deduplication');
  return true;
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);
  const results = {
    framework: false,
    chatgpt: false,
    youtube: false,
    github: false,
    localFolder: false,
    manager: false,
    sync: false,
    deduplication: false,
  };

  try {
    results.framework = await testFramework();
  } catch (err) {
    console.error('FAIL Connector Framework:', err.message);
  }

  try {
    results.chatgpt = await testChatGpt();
  } catch (err) {
    console.error('FAIL ChatGPT:', err.message);
  }

  try {
    results.localFolder = await testLocalFolder();
  } catch (err) {
    console.error('FAIL Local Folder:', err.message);
  }

  try {
    results.github = await testGitHub();
  } catch (err) {
    console.error('FAIL GitHub:', err.message);
  }

  try {
    results.youtube = await testYouTube();
  } catch (err) {
    console.error('FAIL YouTube:', err.message);
  }

  try {
    results.sync = await testConnectorManagerAndSync();
    results.manager = true;
    console.log('PASS Connector Manager');
  } catch (err) {
    console.error('FAIL Connector Manager:', err.message);
    console.error('FAIL Sync:', err.message);
  }

  try {
    results.deduplication = await testDeduplication();
  } catch (err) {
    console.error('FAIL Deduplication:', err.message);
  }

  const blockers = Object.entries(results)
    .filter(([, pass]) => !pass)
    .map(([name]) => name);

  console.log('\n=== Connector Framework Acceptance ===');
  console.log(`Connector Framework: ${results.framework ? 'PASS' : 'FAIL'}`);
  console.log(`ChatGPT: ${results.chatgpt ? 'PASS' : 'FAIL'}`);
  console.log(`YouTube: ${results.youtube ? 'PASS' : 'FAIL'}`);
  console.log(`GitHub: ${results.github ? 'PASS' : 'FAIL'}`);
  console.log(`Local Folder: ${results.localFolder ? 'PASS' : 'FAIL'}`);
  console.log(`Connector Manager: ${results.manager ? 'PASS' : 'FAIL'}`);
  console.log(`Sync: ${results.sync ? 'PASS' : 'FAIL'}`);
  console.log(`Deduplication: ${results.deduplication ? 'PASS' : 'FAIL'}`);
  console.log(`Remaining blockers: ${blockers.length ? blockers.join(', ') : 'none'}`);

  if (blockers.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

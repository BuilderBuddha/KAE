/**
 * Checkpoint B — native YouTube source identity and honest repository presentation.
 * Fixture-only; no live sync, no media, no migration of existing KRCs.
 */
import fs from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSourceMarkdown,
  isYouTubeSourceDocument,
  writeAxiomSources,
  loadExistingConversationMap,
} from '@scooper/exporters';
import { buildYouTubeDocument } from '@scooper/connector-engine';
import { isChatGptImportSourceFileName } from '@scooper/repository-engine';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function youtubeDoc(overrides = {}) {
  return buildYouTubeDocument({
    videoId: '44eFf-tRiSg',
    title: 'Intro to Agent Builder',
    description: 'Christina Huang guides you through Agent Builder.',
    transcript: '',
    thumbnailUrl: 'https://i.ytimg.com/vi/44eFf-tRiSg/hqdefault.jpg',
    publishDate: '2025-10-06',
    duration: '5:29',
    channelTitle: 'OpenAI',
    captionsAvailable: false,
    captionStatus: 'failed',
    hasTranscriptTimestamps: false,
    metadata: {
      watchUrl: 'https://www.youtube.com/watch?v=44eFf-tRiSg',
      connectorId: 'youtube',
    },
    ...overrides,
  });
}

function classification(primary = 'Axiom') {
  return {
    categories: [primary, 'Technical Build'],
    primaryCategory: primary,
    confidence: 57,
    inferredProject: primary,
    recurringTerms: ['agent', 'builder'],
    uncertain: false,
    rationale: 'Fixture classification for Checkpoint B.',
    categoryScores: {
      VIGS: 0,
      'Founder OS': 0,
      Axiom: 4,
      Book: 0,
      'Knowledge Recovery': 0,
      'Source Material': 1,
      'Technical Build': 2,
      'Other / Review Needed': 0,
    },
  };
}

function chatgptDoc() {
  return {
    id: 'chatgpt-fixture-conv-001',
    title: 'Fixture ChatGPT Conversation',
    content: '### User\nHello\n\n### Assistant\nHi there',
    format: 'chatgpt-export-zip',
    metadata: {
      conversationId: 'chatgpt-fixture-conv-001',
      messageCount: 2,
      createTime: 1_700_000_000,
      updateTime: 1_700_000_100,
    },
  };
}

async function withTempRepo(run) {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'kae-checkpoint-b-'));
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function listMdRecursive(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMdRecursive(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

async function main() {
  console.log('Checkpoint B — YouTube native identity');

  const failedDoc = youtubeDoc();
  assert(failedDoc.format === 'youtube', 'format youtube');
  assert(isYouTubeSourceDocument(failedDoc), 'trusted YouTube discriminator');
  assert(failedDoc.metadata.conversationId === 'youtube:44eFf-tRiSg', '3 internal identity');
  assert(failedDoc.content.includes('## YouTube Video ID\n44eFf-tRiSg'), 'doc content Video ID');
  assert(failedDoc.content.includes('## Source Key\nyoutube:44eFf-tRiSg'), 'doc content Source Key');
  assert(!failedDoc.content.includes('## ChatGPT Conversation ID'), 'doc content no ChatGPT ID');

  const md = buildSourceMarkdown('KRC-9001', failedDoc, classification());
  assert(md.includes('## Source\nYouTube'), '1 Source: YouTube');
  assert(md.includes('## YouTube Video ID\n44eFf-tRiSg'), '2 raw Video ID');
  assert(md.includes('## Source Key\nyoutube:44eFf-tRiSg'), '3 Source Key identity');
  assert(!md.includes('## ChatGPT Conversation ID'), '4 no ChatGPT Conversation ID heading');
  assert(!/ChatGPT conversation/i.test(md), '5a no ChatGPT conversation wording');
  assert(!/ChatGPT export/i.test(md), '5b no ChatGPT export wording');
  assert(!/acquired from ChatGPT export/i.test(md), '5c no acquired from ChatGPT export');
  assert(md.includes('## Channel\nOpenAI'), '6 channel');
  assert(md.includes('## Publish Date\n2025-10-06'), '6 publish date');
  assert(md.includes('## Duration\n5:29'), '6 duration');
  assert(md.includes('## Description\nChristina Huang'), '6 description');
  assert(md.includes('## Captions\nFailed'), '6 caption status');
  assert(!md.includes('## Transcript'), '8 failed → no transcript');
  assert(md.includes('/ YouTube video'), 'topic YouTube video');
  assert(md.includes('Acquired by KAE from YouTube'), 'notes from YouTube');
  console.log('PASS 1–6,8 YouTube markdown honesty (failed captions)');

  const acquired = youtubeDoc({
    transcript: '[0:01] Hello builders',
    captionsAvailable: true,
    captionStatus: 'acquired',
    hasTranscriptTimestamps: true,
  });
  const acquiredMd = buildSourceMarkdown('KRC-9002', acquired, classification());
  assert(acquiredMd.includes('## Captions\nAcquired'), '7 captions acquired');
  assert(acquiredMd.includes('## Transcript\n[0:01] Hello builders'), '7 transcript present');
  assert(!acquiredMd.includes('## ChatGPT Conversation ID'), '7 no chatgpt id');
  console.log('PASS 7 transcript only when acquired');

  const unavailable = youtubeDoc({
    captionStatus: 'unavailable',
    captionsAvailable: false,
    transcript: '',
    description: 'Meta only description.',
  });
  const unavailableMd = buildSourceMarkdown('KRC-9003', unavailable, classification('Source Material'));
  assert(unavailableMd.includes('## Captions\nUnavailable'), '8 unavailable status');
  assert(!unavailableMd.includes('## Transcript'), '8 unavailable no transcript');
  assert(!unavailableMd.includes('## Transcript\nMeta only'), '8 no description-as-transcript');
  console.log('PASS 8 unavailable/failed no caption transcript');

  await withTempRepo(async (repo) => {
    const result = await writeAxiomSources([failedDoc], repo, {
      importFileName: 'youtube-sync-fixture',
    });
    assert(result.sourcesCreated === 1, '9 one source created');
    assert(result.sessionsCreated === 0, '9 no executive session twin');
    const sessions = listMdRecursive(join(repo, 'ExecutiveSessions'));
    assert(sessions.length === 0, '9 no session files written');
    const sources = listMdRecursive(join(repo, 'Sources'));
    assert(sources.length === 1, '9 one source file');
    const written = readFileSync(sources[0], 'utf8');
    assert(written.includes('## Source\nYouTube'), '9 written Source YouTube');
    assert(written.includes('## YouTube Video ID\n44eFf-tRiSg'), '9 written Video ID');
    assert(!written.includes('ChatGPT Conversation ID'), '9 written no ChatGPT ID');

    const map = await loadExistingConversationMap(repo);
    assert(map.get('youtube:44eFf-tRiSg') != null, '14 dedup map loads Source Key');

    // Re-write same identity → update path, still no session
    const again = await writeAxiomSources([failedDoc], repo, {
      importFileName: 'youtube-sync-fixture-2',
    });
    assert(again.sessionsCreated === 0, '14 update still suppresses session');
    assert(listMdRecursive(join(repo, 'ExecutiveSessions')).length === 0, '14 still no sessions');
  });
  console.log('PASS 9,14 YouTube sync suppresses session + dedup key');

  const chatMd = buildSourceMarkdown('KRC-0100', chatgptDoc(), classification('VIGS'));
  assert(chatMd.includes('ChatGPT conversation acquired by KAE'), '10 ChatGPT Description intact');
  assert(chatMd.includes('## ChatGPT Conversation ID\nchatgpt-fixture-conv-001'), '10 ChatGPT ID intact');
  assert(chatMd.includes('Acquired by KAE from ChatGPT export'), '10 ChatGPT Notes intact');
  assert(chatMd.includes('## Transcript'), '10 ChatGPT Transcript section intact');
  assert(!isYouTubeSourceDocument(chatgptDoc()), '10 ChatGPT not typed YouTube');
  console.log('PASS 10 ChatGPT Import Markdown unchanged');

  assert(isChatGptImportSourceFileName('KRC-0053_VIGS_Beta_Session_Setup.md') === true, '11 band membership ChatGPT');
  assert(isChatGptImportSourceFileName('KRC-0147_Intro_to_Agent_Builder.md') === false, '11 YouTube KRC not ChatGPT Import by band alone');
  assert(isYouTubeSourceDocument(failedDoc) === true, '13 YouTube typing via format/metadata');
  assert(failedDoc.format === 'youtube', '13 format discriminator');
  assert(failedDoc.metadata.connectorId === 'youtube', '13 connectorId discriminator');
  // Prove typing is not "KRC number band"
  const highKrcName = 'KRC-9001_Intro_to_Agent_Builder.md';
  assert(isChatGptImportSourceFileName(highKrcName) === false, '13 YouTube not ChatGPT Import via band');
  console.log('PASS 11,13 ChatGPT membership + YouTube typing not band-only');

  await withTempRepo(async (repo) => {
    const result = await writeAxiomSources([chatgptDoc()], repo, {
      importFileName: 'chatgpt-fixture.zip',
    });
    assert(result.sourcesCreated === 1, '12 ChatGPT source created');
    assert(result.sessionsCreated === 1, '12 ChatGPT Executive Session still created');
    const sessions = listMdRecursive(join(repo, 'ExecutiveSessions'));
    assert(sessions.length === 1, '12 one session twin');
    const sessionBody = readFileSync(sessions[0], 'utf8');
    assert(sessionBody.includes('Executive Session') || sessionBody.includes('KRC-'), '12 session content written');
  });
  console.log('PASS 12 ChatGPT Executive Session behavior unchanged');

  // Source writer still contains ChatGPT branch (A5-compatible)
  const writerSrc = readFileSync(
    join(repoRoot, 'packages/exporters/src/axiom/source-markdown.ts'),
    'utf8',
  );
  assert(writerSrc.includes('ChatGPT conversation acquired by KAE'), 'ChatGPT branch preserved');
  assert(writerSrc.includes("doc.format === 'youtube'") || writerSrc.includes('isYouTubeSourceDocument'), 'YouTube branch present');
  assert(!writerSrc.includes('BotGuard'), 'no PoToken/BotGuard in writer');

  console.log('\nAll Checkpoint B YouTube identity tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

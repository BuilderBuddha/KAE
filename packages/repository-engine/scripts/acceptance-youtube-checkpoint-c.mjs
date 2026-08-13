/**
 * Checkpoint C — canonical YouTube URL + transcript-only evidence indexing.
 * Fixture-only; no live sync, media, migration, or STT.
 */
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCanonicalYouTubeWatchUrl,
  isTrustedYouTubeWatchUrl,
  isValidYouTubeVideoId,
} from '@scooper/core';
import { evidenceFingerprint } from '@scooper/ai-orchestration';
import { buildSourceMarkdown } from '@scooper/exporters';
import { buildYouTubeDocument } from '@scooper/connector-engine';
import {
  parseYouTubeSourceMarkdown,
  firstTranscriptTimestampSeconds,
  resolveEvidenceDrilldown,
  prepareExecutiveBriefTask,
  reviseExecutiveBriefTask,
  cancelExecutiveBriefTask,
  writeApprovedExecutiveBrief,
} from '@scooper/repository-engine';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function classification() {
  return {
    categories: ['Technical Build'],
    primaryCategory: 'Technical Build',
    confidence: 70,
    inferredProject: 'Technical Build',
    recurringTerms: ['agents'],
    uncertain: false,
    rationale: 'Checkpoint C fixture',
    categoryScores: {
      VIGS: 0,
      'Founder OS': 0,
      Axiom: 0,
      Book: 0,
      'Knowledge Recovery': 0,
      'Source Material': 0,
      'Technical Build': 5,
      'Other / Review Needed': 0,
    },
  };
}

function youtubeDoc(overrides = {}) {
  return buildYouTubeDocument({
    videoId: 'tK32trvj_b4',
    title: 'Build Hour: Agents SDK',
    description: 'DESCRIPTION_ONLY_NOT_TRANSCRIPT unique marker.',
    transcript: '',
    thumbnailUrl: 'https://i.ytimg.com/vi/tK32trvj_b4/hqdefault.jpg',
    publishDate: '2026-05-28',
    duration: '47:40',
    channelTitle: 'OpenAI',
    captionsAvailable: false,
    captionStatus: 'failed',
    metadata: { connectorId: 'youtube' },
    ...overrides,
  });
}

function youtubeKrcMarkdown(opts) {
  const doc = youtubeDoc(opts);
  return buildSourceMarkdown('KRC-9801', doc, classification());
}

function indexFromMarkdown(markdown, relativePath = 'Sources/Technical_Build/KRC-9801_Build_Hour.md') {
  const parsed = parseYouTubeSourceMarkdown(markdown);
  assert(parsed, 'parsed youtube markdown');
  const records = [];
  const repository = {
    krcId: parsed.krcId,
    repositoryPath: relativePath,
    category: 'sources',
    sourceType: 'youtube',
  };
  const conversation = { conversationId: parsed.sourceKey, title: parsed.title };
  records.push({
    id: `${parsed.krcId}:source`,
    kind: 'source',
    repository,
    conversation,
    youtube: {
      sourceType: 'youtube',
      sourceKey: parsed.sourceKey,
      videoId: parsed.videoId,
      originalSourceUrl: parsed.originalSourceUrl,
      captionStatus: parsed.captionStatus,
      provenanceKind: 'youtube_metadata',
    },
    excerpt: parsed.title,
  });
  if (parsed.captionStatus.toLowerCase() === 'acquired' && parsed.transcript) {
    const timestampSeconds = firstTranscriptTimestampSeconds(parsed.transcript);
    records.push({
      id: `${parsed.krcId}:transcript:0`,
      kind: 'message',
      repository,
      conversation,
      youtube: {
        sourceType: 'youtube',
        sourceKey: parsed.sourceKey,
        videoId: parsed.videoId,
        originalSourceUrl: parsed.originalSourceUrl,
        captionStatus: parsed.captionStatus,
        provenanceKind: 'youtube_creator_captions',
        ...(typeof timestampSeconds === 'number' ? { timestampSeconds } : {}),
      },
      message: {
        messageId: `${parsed.krcId}:transcript:0`,
        role: 'youtube_caption',
        text: parsed.transcript,
        searchTerms: [],
      },
      excerpt: parsed.transcript.slice(0, 160),
    });
  }
  return {
    version: 1,
    repositoryPath: '/tmp/fixture',
    builtAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  };
}

function baseAnswer(evidenceUsed, explorerPath) {
  return {
    question: 'What did the Build Hour cover?',
    intent: 'executive_brief',
    searchQuery: 'Build Hour Agents',
    directAnswer: 'Fixture answer',
    reasonedSummary: 'Fixture summary',
    evidenceUsed,
    confidence: { level: 'high', score: 80, rationale: 'fixture' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [{ label: 'source', path: explorerPath }],
    relationshipInsights: { related: [], blockers: [], decisions: [] },
  };
}

async function withTempRepo(run) {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'kae-checkpoint-c-'));
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  console.log('Checkpoint C — YouTube canonical URL + transcript evidence');

  const failedMd = youtubeKrcMarkdown();
  assert(
    failedMd.includes('## Original Source URL\nhttps://www.youtube.com/watch?v=tK32trvj_b4'),
    '1 canonical URL persisted',
  );
  assert(
    buildCanonicalYouTubeWatchUrl('tK32trvj_b4') === 'https://www.youtube.com/watch?v=tK32trvj_b4',
    '2 derived from validated ID',
  );
  assert(buildCanonicalYouTubeWatchUrl('bad') === null, '3 invalid ID → null URL');
  assert(isValidYouTubeVideoId('tK32trvj_b4'), '3 valid id');
  assert(!isValidYouTubeVideoId('short'), '3 invalid short');
  assert(failedMd.includes('## Source Key\nyoutube:tK32trvj_b4'), '4 internal identity');
  assert(failedMd.includes('## YouTube Video ID\ntK32trvj_b4'), '4 raw display id');
  console.log('PASS 1–4 URL + identity');

  const acquiredMd = youtubeKrcMarkdown({
    captionStatus: 'acquired',
    captionsAvailable: true,
    transcript: '[0:01] Hello from acquired captions only.',
  });
  const acquiredIndex = indexFromMarkdown(acquiredMd);
  const transcriptRec = acquiredIndex.records.find((r) => r.kind === 'message');
  assert(transcriptRec, '5 acquired creates transcript evidence');
  assert(transcriptRec.youtube.sourceKey === 'youtube:tK32trvj_b4', '6 source key');
  assert(transcriptRec.youtube.videoId === 'tK32trvj_b4', '6 video id');
  assert(
    transcriptRec.youtube.originalSourceUrl === 'https://www.youtube.com/watch?v=tK32trvj_b4',
    '6 original URL',
  );
  assert(transcriptRec.excerpt.includes('Hello from acquired'), '6 excerpt from transcript');
  assert(!transcriptRec.excerpt.includes('DESCRIPTION_ONLY'), '9 description not transcript evidence');

  const failedIndex = indexFromMarkdown(failedMd);
  assert(!failedIndex.records.some((r) => r.kind === 'message'), '7 failed → no transcript evidence');
  assert(failedIndex.records.some((r) => r.kind === 'source'), '10 metadata source discoverable');
  assert(failedIndex.records[0].youtube.provenanceKind === 'youtube_metadata', '10 metadata typed');
  assert(!failedIndex.records[0].excerpt.includes('DESCRIPTION_ONLY'), '9 source excerpt not description');

  const unavailableMd = youtubeKrcMarkdown({
    captionStatus: 'unavailable',
    captionsAvailable: false,
  });
  const unavailableIndex = indexFromMarkdown(unavailableMd);
  assert(!unavailableIndex.records.some((r) => r.kind === 'message'), '8 unavailable → no transcript');
  console.log('PASS 5–10 evidence indexing');

  assert(firstTranscriptTimestampSeconds('[0:01] hi') === 1, '11 valid timestamp');
  assert(firstTranscriptTimestampSeconds('no stamps here') === undefined, '12 no invented timestamp');
  assert(typeof transcriptRec.youtube.timestampSeconds === 'number', '11 acquired retains timestampSeconds');
  const plainAcquired = indexFromMarkdown(
    youtubeKrcMarkdown({
      captionStatus: 'acquired',
      captionsAvailable: true,
      transcript: 'Plain caption without timing',
    }),
  );
  const plainMsg = plainAcquired.records.find((r) => r.kind === 'message');
  assert(plainMsg.youtube.timestampSeconds === undefined, '12 missing timestamps omit field');
  console.log('PASS 11–12 timestamps');

  const parsedAcquired = parseYouTubeSourceMarkdown(acquiredMd);
  const drill = resolveEvidenceDrilldown(acquiredIndex, `${parsedAcquired.krcId}:transcript:0`);
  assert(drill, '13 drilldown resolved');
  assert(drill.sections.conversation.title === 'YouTube Evidence', '13 YouTube Evidence label');
  assert(drill.sections.messages.title === 'Original YouTube Source', '13 Original YouTube Source');
  assert(drill.sections.executiveSession.items.length === 0, '13 no executive session items');
  assert(
    drill.sections.executiveSession.emptyMessage.includes('No automatic Executive Session'),
    '13 honest no session',
  );
  assert(!drill.timeline.some((s) => s.kind === 'conversation'), '13 no Conversation timeline kind');
  assert(drill.timeline.some((s) => s.kind === 'youtube_evidence'), '13 youtube_evidence step');
  assert(drill.timeline.some((s) => s.kind === 'youtube_original_source'), '13 original source step');
  console.log('PASS 13 evidence chain');

  const good = 'https://www.youtube.com/watch?v=tK32trvj_b4';
  assert(isTrustedYouTubeWatchUrl(good), '14 trusted form accepted');
  assert(!isTrustedYouTubeWatchUrl('https://evil.example/watch?v=tK32trvj_b4'), '15 reject arbitrary host');
  assert(!isTrustedYouTubeWatchUrl('https://youtu.be/tK32trvj_b4'), '15 reject youtu.be');
  assert(!isTrustedYouTubeWatchUrl('https://www.youtube.com/watch?v=tK32trvj_b4&t=10'), '15 reject extras');
  assert(!isTrustedYouTubeWatchUrl('javascript:alert(1)'), '15 reject non-http');
  const mainSrc = readFileSync(join(repoRoot, 'apps/desktop/electron/main.ts'), 'utf8');
  assert(mainSrc.includes('kae:open-trusted-youtube-url'), '14 IPC authority present');
  assert(mainSrc.includes('isTrustedYouTubeWatchUrl'), '14 validates before openExternal');
  assert(mainSrc.includes('shell.openExternal'), '14 uses openExternal after allowlist');
  console.log('PASS 14–15 trusted open validation');

  await withTempRepo(async (repo) => {
    const citation = {
      recordId: 'KRC-9801:transcript:0',
      label: 'Build Hour: Agents SDK',
      excerpt: '[0:01] Hello from acquired captions only.',
      explorerPath: 'Sources/Technical_Build/KRC-9801_Build_Hour.md',
      krcId: 'KRC-9801',
      kind: 'message',
      sourceType: 'youtube',
      sourceKey: 'youtube:tK32trvj_b4',
      videoId: 'tK32trvj_b4',
      originalSourceUrl: good,
      timestampSeconds: 1,
    };
    const answer = baseAnswer([citation], citation.explorerPath);
    const fp = evidenceFingerprint(answer);
    const prepared = prepareExecutiveBriefTask({
      conversationId: 'fixture-conv-c',
      topic: 'Build Hour',
      answer,
    });
    assert(prepared.evidence.fingerprint === fp, '16 fingerprint frozen');
    const frozen = prepared.evidence.evidenceUsed[0];
    assert(frozen.videoId === 'tK32trvj_b4', '16 videoId frozen');
    assert(frozen.originalSourceUrl === good, '16 URL frozen');
    assert(frozen.sourceKey === 'youtube:tK32trvj_b4', '16 sourceKey frozen');
    assert(frozen.excerpt.includes('Hello from acquired'), '16 excerpt frozen');

    const revised = reviseExecutiveBriefTask(prepared, {
      taskId: prepared.taskId,
      answer: {
        ...answer,
        evidenceUsed: [
          {
            ...citation,
            videoId: 'HACKED00001',
            originalSourceUrl: 'https://evil.example/x',
            excerpt: 'swapped',
          },
        ],
      },
    });
    assert(revised.evidence.evidenceUsed[0].videoId === 'tK32trvj_b4', '16 revise cannot swap videoId');
    assert(revised.evidence.evidenceUsed[0].originalSourceUrl === good, '16 revise cannot swap URL');
    assert(revised.evidence.fingerprint === fp, '16 fingerprint stable on revise');

    cancelExecutiveBriefTask(prepared);
    assert(!existsSync(join(repo, 'ImportReports')), '17 cancel writes nothing');

    const fresh = prepareExecutiveBriefTask({
      conversationId: 'fixture-conv-c2',
      topic: 'Build Hour',
      answer,
    });
    const written = await writeApprovedExecutiveBrief(
      fresh,
      { taskId: fresh.taskId, approvalToken: fresh.taskId },
      { repositoryPath: repo },
    );
    assert(written.writeResult?.relativePath, '18 approval wrote');
    const body = await fs.readFile(join(repo, written.writeResult.relativePath), 'utf8');
    assert(body.includes(fresh.evidence.fingerprint), '18 fingerprint in artifact');
    assert(body.includes('Hello from acquired') || body.includes('KRC-9801'), '18 frozen evidence persisted');
  });
  console.log('PASS 16–18 freeze / cancel / approve');

  const chatCitation = {
    recordId: 'KRC-0100:msg:0',
    label: 'ChatGPT fixture',
    excerpt: 'hello',
    explorerPath: 'Sources/VIGS/KRC-0100_x.md',
    krcId: 'KRC-0100',
    kind: 'message',
  };
  const chatAnswer = baseAnswer([chatCitation], chatCitation.explorerPath);
  const chatFp = evidenceFingerprint(chatAnswer);
  assert(chatFp === `${chatCitation.recordId}::::${chatCitation.explorerPath}`, '20 chatgpt fingerprint shape');
  assert(!('originalSourceUrl' in chatCitation), '19 chatgpt citation has no youtube fields required');
  const verifySrc = readFileSync(join(repoRoot, 'packages/ai-orchestration/src/verify.ts'), 'utf8');
  assert(
    verifySrc.includes("answer.evidenceUsed.map((item) => item.recordId).join('|')"),
    '20 fingerprint still recordId-based',
  );
  console.log('PASS 19–20 ChatGPT citation/fingerprint compatibility');

  const writer = readFileSync(join(repoRoot, 'packages/exporters/src/axiom/source-markdown.ts'), 'utf8');
  assert(writer.includes('ChatGPT conversation acquired by KAE'), 'ChatGPT branch preserved');

  console.log('\nAll Checkpoint C focused tests passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

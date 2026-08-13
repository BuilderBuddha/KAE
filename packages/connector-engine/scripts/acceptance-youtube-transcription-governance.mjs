/**
 * A2a — inert YouTube transcription governance contracts (fixture-only).
 * No live STT, media I/O, network, credentials, or artifact writes.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YOUTUBE_TRANSCRIPTION_PILOT_LIMITS,
  YOUTUBE_TRANSCRIPTION_INVOCATION,
  YOUTUBE_TRANSCRIPTION_A2A_BOUNDARY,
  youtubeSourceKey,
  isTranscriptionAuthorized,
  validateTranscriptionAuthorization,
  createTranscriptionAuthorization,
  requiredTranscriptionAttestationPhrase,
  classifyYouTubeCaptionProvenance,
  buildKaeMachineTranscriptionProvenance,
  buildTranscriptionIdempotencyKey,
  evaluateIdempotency,
  evaluatePilotTranscriptionPolicy,
  assertSafePolicyOutput,
  scheduledSyncMayInvokeTranscription,
  connectorSyncMayInvokeTranscription,
} from '@scooper/connector-engine';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '../../..');
const connectorSrc = join(repoRoot, 'packages/connector-engine/src');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(rel) {
  return readFileSync(join(connectorSrc, rel), 'utf8');
}

function main() {
  console.log('A2a — YouTube transcription governance (inert)');

  const videoId = '44eFf-tRiSg';
  const fingerprint = 'sha256:fixture-media-hash-001';
  const provider = 'openai';
  const modelVersion = 'whisper-1';

  // 1. Authorization defaults to denied
  assert(isTranscriptionAuthorized(null, videoId) === false, '1 default denied (null)');
  assert(isTranscriptionAuthorized(undefined, videoId) === false, '1 default denied (undefined)');
  console.log('PASS 1 authorization defaults denied');

  // 2. URL or local path alone does not authorize
  const pathOnly = validateTranscriptionAuthorization(null, videoId, {
    videoUrl: 'https://www.youtube.com/watch?v=44eFf-tRiSg',
    localFilePath: 'C:\\Users\\example\\clip.mp3',
  });
  assert(pathOnly.ok === false, '2 URL/path alone not ok');
  assert(pathOnly.status === 'not_authorized', '2 status not_authorized');
  console.log('PASS 2 URL/path alone does not authorize');

  // 3. Explicit valid attestation → eligible (ready) for future processing
  const grant = createTranscriptionAuthorization({
    videoId,
    authorizationId: 'auth-fixture-001',
    authorizedAt: '2026-08-07T17:00:00.000Z',
  });
  const valid = validateTranscriptionAuthorization(grant, videoId);
  assert(valid.ok === true, '3 valid grant ok');
  assert(valid.status === 'ready', '3 status ready');
  assert(grant.sourceKey === youtubeSourceKey(videoId), '3 sourceKey youtube:{id}');
  assert(
    grant.attestationStatement === requiredTranscriptionAttestationPhrase(),
    '3 attestation phrase locked',
  );
  console.log('PASS 3 explicit attestation eligible');

  // 4. Missing/invalid authorization → not_authorized
  const bad = validateTranscriptionAuthorization(
    {
      ...grant,
      userAttestedAuthorizedToProcess: true,
      attestationStatement: 'I have the file',
    },
    videoId,
  );
  assert(bad.ok === false && bad.status === 'not_authorized', '4 invalid attestation denied');
  const policyUnauthorized = evaluatePilotTranscriptionPolicy({
    authorization: null,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 5,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
  });
  assert(policyUnauthorized.outcome === 'not_authorized', '4 policy not_authorized');
  assert(policyUnauthorized.transcriptionStatus === 'not_authorized', '4 status not_authorized');
  console.log('PASS 4 invalid/missing → not_authorized');

  // 5. 30-minute per-video limit
  const overVideo = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 31,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
  });
  assert(overVideo.outcome === 'blocked_video_duration', '5 blocked_video_duration');
  assert(overVideo.transcriptionStatus === 'skipped', '5 skipped');
  assert(YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerVideo === 30, '5 limit constant 30');
  console.log('PASS 5 per-video minute limit');

  // 6. 60-minute daily limit
  const overDay = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 20,
    dailyMinutesUsed: 45,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
  });
  assert(overDay.outcome === 'blocked_daily_minutes', '6 blocked_daily_minutes');
  assert(YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerDay === 60, '6 limit constant 60');
  console.log('PASS 6 daily minute limit');

  // 7. $1 daily estimated-cost limit
  const overCost = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 5,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0.8,
    estimatedUsdForRequest: 0.3,
  });
  assert(overCost.outcome === 'blocked_daily_cost', '7 blocked_daily_cost');
  assert(YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxEstimatedUsdPerDay === 1, '7 limit constant $1');
  console.log('PASS 7 daily cost limit');

  // 8. Completed idempotency key blocked from rebilling
  const key = buildTranscriptionIdempotencyKey({
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
  });
  const completedLedger = [{ key, state: 'completed' }];
  assert(evaluateIdempotency(completedLedger, key) === 'blocked_duplicate', '8 idem duplicate');
  const dupPolicy = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 5,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
    ledger: completedLedger,
  });
  assert(dupPolicy.outcome === 'blocked_duplicate', '8 policy blocked_duplicate');
  console.log('PASS 8 completed key not rebilled');

  // 9. Failed attempt distinguishable / retryable without billed
  const failedLedger = [{ key, state: 'failed', detail: 'fixture provider error' }];
  assert(evaluateIdempotency(failedLedger, key) === 'retryable_failed', '9 retryable_failed');
  const retryPolicy = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 5,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
    ledger: failedLedger,
  });
  assert(retryPolicy.outcome === 'allowed', '9 retry allowed');
  assert(retryPolicy.transcriptionStatus === 'ready', '9 ready for future A2b');
  console.log('PASS 9 failed attempt retryable, not billed');

  // 10. Provenance distinguishes creator / YouTube machine / KAE machine
  assert(classifyYouTubeCaptionProvenance('creator') === 'youtube_creator_captions', '10 creator');
  assert(classifyYouTubeCaptionProvenance('standard') === 'youtube_creator_captions', '10 standard');
  assert(classifyYouTubeCaptionProvenance('asr') === 'youtube_machine_captions', '10 yt machine');
  const kaeProv = buildKaeMachineTranscriptionProvenance({
    provider,
    modelVersion,
    mediaFingerprint: fingerprint,
    authorizationId: grant.authorizationId,
    authorizedAt: grant.authorizedAt,
  });
  assert(kaeProv.kind === 'kae_machine_transcription', '10 kae kind');
  assert(kaeProv.machineTranscriptionLabel === 'KAE machine transcription', '10 label');
  console.log('PASS 10 provenance kinds distinct');

  // 11. Machine timestamps only when supplied by future provider
  const noTs = buildKaeMachineTranscriptionProvenance({
    provider,
    modelVersion,
    mediaFingerprint: fingerprint,
    authorizationId: grant.authorizationId,
    authorizedAt: grant.authorizedAt,
    segments: [{ text: 'hello' }],
  });
  assert(noTs.hasProviderTimestamps === false, '11 no invented timestamps');
  const withTs = buildKaeMachineTranscriptionProvenance({
    provider,
    modelVersion,
    mediaFingerprint: fingerprint,
    authorizationId: grant.authorizationId,
    authorizedAt: grant.authorizedAt,
    segments: [{ text: 'hello', startSeconds: 1.5 }],
  });
  assert(withTs.hasProviderTimestamps === true, '11 provider timestamps retained');
  console.log('PASS 11 timestamps only when supplied');

  // 12. Raw media / credentials / local file content absent from outputs
  assertSafePolicyOutput(retryPolicy);
  assertSafePolicyOutput(completedLedger);
  assertSafePolicyOutput(kaeProv);
  assert(!JSON.stringify(retryPolicy).includes('localFilePath'), '12 no path in policy');
  assert(!JSON.stringify(key).includes('apiKey'), '12 no apiKey in key');
  console.log('PASS 12 safe outputs');

  // 13. Scheduled synchronization has no route to invoke transcription
  assert(scheduledSyncMayInvokeTranscription() === false, '13 scheduled false');
  assert(connectorSyncMayInvokeTranscription() === false, '13 connector sync false');
  assert(YOUTUBE_TRANSCRIPTION_INVOCATION.mode === 'on_demand_only', '13 on_demand_only');
  assert(YOUTUBE_TRANSCRIPTION_A2A_BOUNDARY.liveExecution === false, '13 no live execution');
  assert(YOUTUBE_TRANSCRIPTION_A2A_BOUNDARY.callsProviders === false, '13 no providers');
  assert(YOUTUBE_TRANSCRIPTION_A2A_BOUNDARY.processesMedia === false, '13 no media');

  const youtubeTs = read('connectors/youtube.ts');
  const youtubeFetchTs = read('connectors/youtube-fetch.ts');
  const schedulerTs = read('scheduler.ts');
  const workerTs = read('worker.ts');
  const syncTs = read('sync.ts');
  const governanceTs = read('connectors/youtube-transcription-governance.ts');

  for (const [name, src] of [
    ['youtube.ts', youtubeTs],
    ['youtube-fetch.ts', youtubeFetchTs],
    ['scheduler.ts', schedulerTs],
    ['worker.ts', workerTs],
    ['sync.ts', syncTs],
  ]) {
    assert(
      !src.includes('youtube-transcription-governance'),
      `13 ${name} must not import transcription governance`,
    );
    assert(!/\btranscribeMedia\b/.test(src), `13 ${name} has no transcribeMedia`);
    assert(!/\brunTranscription\b/.test(src), `13 ${name} has no runTranscription`);
    assert(!/audio\/transcriptions/.test(src), `13 ${name} has no audio API path`);
  }
  assert(
    !/\b(export\s+(async\s+)?function\s+transcribeMedia|export\s+const\s+transcribeMedia)\b/.test(
      governanceTs,
    ),
    '13 governance has no transcribeMedia executor export',
  );
  assert(!/audio\/transcriptions/.test(governanceTs), '13 governance has no audio API path');
  assert(
    !/\bfrom\s+['"]openai['"]/.test(governanceTs) && !/api\.openai\.com/.test(governanceTs),
    '13 governance does not embed OpenAI client',
  );
  console.log('PASS 13 scheduler/sync isolation');

  // Allowed happy path stays ready (not processing/acquired)
  const allowed = evaluatePilotTranscriptionPolicy({
    authorization: grant,
    videoId,
    mediaFingerprint: fingerprint,
    provider,
    modelVersion,
    mediaDurationMinutes: 5,
    dailyMinutesUsed: 0,
    dailyEstimatedUsdUsed: 0,
    estimatedUsdForRequest: 0.1,
  });
  assert(allowed.outcome === 'allowed', 'ready path allowed');
  assert(allowed.transcriptionStatus === 'ready', 'A2a never emits acquired/processing');
  assert(
    allowed.transcriptionStatus !== 'processing' && allowed.transcriptionStatus !== 'acquired',
    'A2a inert statuses only',
  );

  console.log('\nAll A2a YouTube transcription governance tests passed.');
}

main();

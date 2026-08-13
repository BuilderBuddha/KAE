/**
 * Checkpoint A — honest YouTube caption acquisition and status discrimination.
 * Pure/unit tests with fixtures; no live network; no STT.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTimedTextSegments,
  formatTranscriptFromSegments,
  classifyCaptionTrackList,
  buildYouTubeDocument,
} from '@scooper/connector-engine';

const scriptDir = dirname(fileURLToPath(import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function basePayload(overrides = {}) {
  return {
    videoId: 'YkCDVn3_wiw',
    title: 'Introduction to Deep Research',
    description: 'Mark Chen, Josh Tobin, Neel Ajjarapu, and Isa Fulford introduce and demo deep research from Tokyo.',
    transcript: '',
    thumbnailUrl: 'https://i.ytimg.com/vi/YkCDVn3_wiw/hqdefault.jpg',
    publishDate: '2025-01-01',
    duration: '20:15',
    channelTitle: 'OpenAI',
    captionsAvailable: false,
    captionStatus: 'unavailable',
    hasTranscriptTimestamps: false,
    metadata: {
      watchUrl: 'https://www.youtube.com/watch?v=YkCDVn3_wiw',
      connectorId: 'youtube',
    },
    ...overrides,
  };
}

function main() {
  console.log('Checkpoint A — YouTube caption honesty');

  // A1 — Captions acquired with valid timing retained
  const timedXml = [
    '<transcript>',
    '<text start="1.5" dur="2.0">Hello founders</text>',
    '<text start="4.0" dur="1.5">Welcome to deep research</text>',
    '</transcript>',
  ].join('');
  const timedSegments = parseTimedTextSegments(timedXml);
  assert(timedSegments.length === 2, 'A1 parses two segments');
  assert(timedSegments[0].startSeconds === 1.5, 'A1 retains valid start timing');
  assert(timedSegments[0].text === 'Hello founders', 'A1 caption text preserved');
  const timedFormatted = formatTranscriptFromSegments(timedSegments);
  assert(timedFormatted.hasTimestamps === true, 'A1 hasTimestamps true');
  assert(timedFormatted.transcript.includes('[0:01] Hello founders'), 'A1 formats timestamp without inventing');
  assert(timedFormatted.transcript.includes('[0:04] Welcome to deep research'), 'A1 second timestamp');

  const acquiredDoc = buildYouTubeDocument(
    basePayload({
      transcript: timedFormatted.transcript,
      captionsAvailable: true,
      captionStatus: 'acquired',
      hasTranscriptTimestamps: true,
    }),
  );
  assert(acquiredDoc.id === 'youtube:YkCDVn3_wiw', 'A1 identity youtube:{videoId}');
  assert(acquiredDoc.metadata.conversationId === 'youtube:YkCDVn3_wiw', 'A1 dedup key unchanged');
  assert(acquiredDoc.metadata.captionsAvailable === true, 'A1 captionsAvailable true');
  assert(acquiredDoc.metadata.captionStatus === 'acquired', 'A1 status acquired');
  assert(acquiredDoc.content.includes('## Captions\nAcquired'), 'A1 Captions label Acquired');
  assert(acquiredDoc.content.includes('## Transcript\n'), 'A1 emits Transcript section');
  assert(acquiredDoc.content.includes('[0:01] Hello founders'), 'A1 transcript is real caption text');
  assert(
    acquiredDoc.content.includes('## Description\nMark Chen'),
    'A1 description remains its own field',
  );
  assert(
    !acquiredDoc.content.match(/## Transcript\n[\s\S]*Mark Chen/),
    'A1 description is not the transcript body',
  );
  console.log('PASS A1 captions acquired');

  // Untimed acquired captions — no invented timestamps
  const plainXml = '<transcript><text>Plain caption line</text></transcript>';
  const plainSegments = parseTimedTextSegments(plainXml);
  assert(plainSegments[0].startSeconds === undefined, 'A1b no invented start');
  const plainFormatted = formatTranscriptFromSegments(plainSegments);
  assert(plainFormatted.hasTimestamps === false, 'A1b hasTimestamps false');
  assert(plainFormatted.transcript === 'Plain caption line', 'A1b plain transcript');
  console.log('PASS A1b acquired without inventing timestamps');

  // A2 — Captions unavailable
  const emptyList = classifyCaptionTrackList('<transcript_list></transcript_list>');
  assert(emptyList.outcome === 'unavailable', 'A2 empty track list → unavailable');

  const unavailableDoc = buildYouTubeDocument(
    basePayload({
      transcript: '',
      captionsAvailable: false,
      captionStatus: 'unavailable',
      description: 'Only a one-sentence description.',
    }),
  );
  assert(unavailableDoc.metadata.captionStatus === 'unavailable', 'A2 status unavailable');
  assert(unavailableDoc.metadata.captionsAvailable === false, 'A2 captionsAvailable false');
  assert(unavailableDoc.content.includes('## Captions\nUnavailable'), 'A2 Captions Unavailable');
  assert(unavailableDoc.content.includes('## Description\nOnly a one-sentence description.'), 'A2 Description kept');
  assert(!unavailableDoc.content.includes('## Transcript'), 'A2 Transcript omitted');
  assert(
    !unavailableDoc.content.includes('Only a one-sentence description.') ||
      unavailableDoc.content.indexOf('## Description') <
        unavailableDoc.content.indexOf('Only a one-sentence description.'),
    'A2 description only under Description',
  );
  // Ensure description text does not appear as fabricated transcript evidence section
  assert(
    !/## Transcript\nOnly a one-sentence description/.test(unavailableDoc.content),
    'A2 description never appears as transcript',
  );
  console.log('PASS A2 captions unavailable');

  // A3 — Caption acquisition failure (distinguishable from unavailable)
  const failedDoc = buildYouTubeDocument(
    basePayload({
      transcript: '',
      captionsAvailable: false,
      captionStatus: 'failed',
      captionDetail: 'Caption track list request failed: HTTP 500',
      description: 'Should not become transcript.',
    }),
  );
  assert(failedDoc.metadata.captionStatus === 'failed', 'A3 status failed');
  assert(failedDoc.metadata.captionsAvailable === false, 'A3 captionsAvailable false');
  assert(failedDoc.content.includes('## Captions\nFailed'), 'A3 Captions Failed');
  assert(failedDoc.metadata.captionStatus !== 'unavailable', 'A3 failed ≠ unavailable');
  assert(!failedDoc.content.includes('## Transcript'), 'A3 no transcript section');
  assert(
    !/## Transcript\nShould not become transcript/.test(failedDoc.content),
    'A3 no description-as-transcript fallback',
  );
  console.log('PASS A3 caption acquisition failure');

  // A4 — Metadata-only inventory still builds document without fabricated transcript
  const metaOnly = buildYouTubeDocument(
    basePayload({
      transcript: '',
      captionsAvailable: false,
      captionStatus: 'unavailable',
      description: 'Inventory description only.',
    }),
  );
  assert(metaOnly.id === 'youtube:YkCDVn3_wiw', 'A4 inventoried with identity');
  assert(metaOnly.title === 'Introduction to Deep Research', 'A4 title retained');
  assert(metaOnly.content.includes('## Description\nInventory description only.'), 'A4 description retained');
  assert(!metaOnly.content.includes('## Transcript'), 'A4 no fabricated transcript');
  assert(metaOnly.metadata.captionsAvailable === false, 'A4 not answerable as caption evidence');
  console.log('PASS A4 metadata-only inventory');

  // A5 — Identity/dedup unchanged; Checkpoint A files only; no Brief/ChatGPT Import edits
  assert(metaOnly.metadata.conversationId === 'youtube:YkCDVn3_wiw', 'A5 conversationId key intact');
  assert(metaOnly.metadata.sourceKey === 'youtube:YkCDVn3_wiw', 'A5 sourceKey intact');

  const repoRoot = join(scriptDir, '../../..');
  const fetchSrc = readFileSync(
    join(repoRoot, 'packages/connector-engine/src/connectors/youtube-fetch.ts'),
    'utf8',
  );
  const markdownSrc = readFileSync(
    join(repoRoot, 'packages/connector-engine/src/connectors/youtube-markdown.ts'),
    'utf8',
  );
  assert(!fetchSrc.includes('transcript || description'), 'A5 no description-as-transcript fallback in fetch');
  assert(fetchSrc.includes("status: 'acquired'"), 'A5 acquired status represented');
  assert(fetchSrc.includes("status: 'unavailable'"), 'A5 unavailable status represented');
  assert(fetchSrc.includes("status: 'failed'"), 'A5 failed status represented');
  assert(!fetchSrc.toLowerCase().includes('whisper'), 'A5 no STT/whisper');
  assert(!markdownSrc.includes('payload.transcript || description'), 'A5 markdown does not fallback description');

  // Ensure Checkpoint B–E surfaces were not required in this campaign slice
  const sourceMarkdown = readFileSync(
    join(repoRoot, 'packages/exporters/src/axiom/source-markdown.ts'),
    'utf8',
  );
  assert(
    sourceMarkdown.includes('ChatGPT conversation acquired by KAE'),
    'A5 ChatGPT Import writer unchanged',
  );
  console.log('PASS A5 identity + regression guards');

  console.log('\nAll Checkpoint A YouTube caption honesty tests passed.');
}

main();

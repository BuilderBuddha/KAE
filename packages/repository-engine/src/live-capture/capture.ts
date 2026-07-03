import fs from 'node:fs/promises';
import path from 'node:path';
import type { LiveCaptureInput, LiveCaptureResult } from '@scooper/core';
import {
  ensureRepositoryDirs,
  findHighestKrcNumber,
  formatKrcId,
  slugifyTitle,
} from '@scooper/exporters';
import { buildEvidenceIndex } from '../evidence/build.js';
import { buildRelationshipIndex } from '../relationships/query.js';
import { refreshExecutiveBriefing } from '../awareness/query.js';
import {
  buildLiveCaptureExecutiveSessionMarkdown,
  buildLiveCaptureSourceMarkdown,
} from './markdown.js';
import { deriveCaptureTitle, parseLiveTranscript } from './parse-transcript.js';

const LIVE_CAPTURE_CATEGORY = 'KAE';

/** Captures a live session transcript into the repository and refreshes indexes. */
export async function captureLiveSession(
  repositoryPath: string,
  input: LiveCaptureInput,
): Promise<LiveCaptureResult> {
  const messages = parseLiveTranscript(input.transcript);
  if (messages.length === 0) {
    throw new Error('Transcript is empty.');
  }

  await ensureRepositoryDirs(repositoryPath);
  const krcNum = (await findHighestKrcNumber(repositoryPath)) + 1;
  const krcId = formatKrcId(krcNum);
  const title = deriveCaptureTitle(input.title, messages, input.sourceKind);
  const slug = slugifyTitle(title);

  const sourceFileName = `${krcId}_${slug}.md`;
  const sessionFileName = `${krcId}_${slug}_SESSION.md`;
  const sourceRelativePath = `Sources/${LIVE_CAPTURE_CATEGORY}/${sourceFileName}`;
  const executiveSessionRelativePath = `ExecutiveSessions/${LIVE_CAPTURE_CATEGORY}/${sessionFileName}`;

  const sourceMarkdown = buildLiveCaptureSourceMarkdown(krcId, title, input, messages);
  const sessionMarkdown = buildLiveCaptureExecutiveSessionMarkdown(
    krcId,
    title,
    sourceRelativePath,
    input,
    messages,
  );

  await fs.mkdir(path.join(repositoryPath, 'Sources', LIVE_CAPTURE_CATEGORY), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, 'ExecutiveSessions', LIVE_CAPTURE_CATEGORY), {
    recursive: true,
  });
  await fs.writeFile(path.join(repositoryPath, sourceRelativePath), sourceMarkdown, 'utf8');
  await fs.writeFile(
    path.join(repositoryPath, executiveSessionRelativePath),
    sessionMarkdown,
    'utf8',
  );

  const evidenceIndex = await buildEvidenceIndex(repositoryPath);
  const relationshipIndex = await buildRelationshipIndex(repositoryPath);
  const briefing = await refreshExecutiveBriefing(repositoryPath);

  return {
    krcId,
    sourceRelativePath,
    executiveSessionRelativePath,
    messageCount: messages.length,
    evidenceIndexBuiltAt: evidenceIndex.builtAt,
    relationshipIndexBuiltAt: relationshipIndex.builtAt,
    briefingGeneratedAt: briefing.generatedAt,
  };
}

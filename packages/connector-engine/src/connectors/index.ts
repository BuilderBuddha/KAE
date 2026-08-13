import { chatGptFrameworkConnector } from './chatgpt.js';
import { youtubeConnector } from './youtube.js';
import { githubConnector } from './github.js';
import { localFolderConnector } from './local-folder.js';
import { stubConnectors } from './stubs.js';

export const fullConnectors = [
  chatGptFrameworkConnector,
  youtubeConnector,
  githubConnector,
  localFolderConnector,
];

export const allConnectors = [...fullConnectors, ...stubConnectors];

export {
  chatGptFrameworkConnector,
  youtubeConnector,
  githubConnector,
  localFolderConnector,
  stubConnectors,
};

export {
  parseTimedTextSegments,
  formatTranscriptFromSegments,
  classifyCaptionTrackList,
  fetchYouTubeCaptionAcquisition,
} from './youtube-fetch.js';
export type {
  YouTubeCaptionStatus,
  YouTubeCaptionAcquisition,
  YouTubeVideoPayload,
} from './youtube-fetch.js';
export { buildYouTubeDocument } from './youtube-markdown.js';

export {
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
  findIdempotencyRecord,
  evaluateIdempotency,
  evaluatePilotTranscriptionPolicy,
  assertSafePolicyOutput,
  scheduledSyncMayInvokeTranscription,
  connectorSyncMayInvokeTranscription,
} from './youtube-transcription-governance.js';
export type {
  YouTubeTranscriptProvenanceKind,
  YouTubeTranscriptionStatus,
  YouTubeTranscriptionAuthorization,
  YouTubeTranscriptionSegment,
  KaeMachineTranscriptionProvenance,
  YouTubeCaptionProvenance,
  YouTubeTranscriptionPilotOutcome,
  YouTubeTranscriptionIdempotencyState,
  YouTubeTranscriptionIdempotencyRecord,
  YouTubeTranscriptionIdempotencyParts,
  EvaluatePilotTranscriptionInput,
  EvaluatePilotTranscriptionResult,
} from './youtube-transcription-governance.js';

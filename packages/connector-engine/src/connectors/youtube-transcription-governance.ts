/**
 * A2a — Inert governance contracts for a future user-authorized YouTube
 * transcription fallback (Approach 2).
 *
 * Provider-neutral. No live STT, media I/O, network, credentials, UI,
 * scheduler hooks, or artifact writes. Status values `processing` and
 * `acquired` exist for future A2b representation only; no A2a helper
 * transitions into those states via execution.
 */

/** Distinct evidence origins for caption vs KAE machine transcription. */
export type YouTubeTranscriptProvenanceKind =
  | 'youtube_creator_captions'
  | 'youtube_machine_captions'
  | 'kae_machine_transcription';

/**
 * Separate from Checkpoint A `captionStatus`.
 * A2a policy helpers never emit `processing` or `acquired`.
 */
export type YouTubeTranscriptionStatus =
  | 'not_requested'
  | 'not_authorized'
  | 'ready'
  | 'processing'
  | 'acquired'
  | 'skipped'
  | 'failed';

/** Explicit per-video grant. Default is unauthorized (absence of a valid grant). */
export interface YouTubeTranscriptionAuthorization {
  /** Bare YouTube video id. */
  videoId: string;
  /** Connector identity / dedup key: `youtube:{videoId}`. */
  sourceKey: string;
  /** Stable attestation identifier (not a secret). */
  authorizationId: string;
  /** ISO-8601 timestamp of the user attestation. */
  authorizedAt: string;
  /**
   * Explicit statement that the user is authorized to process the supplied media.
   * Required; never inferred from URL or file path alone.
   */
  attestationStatement: string;
  /** Must be literally true — possession of a path/URL is insufficient. */
  userAttestedAuthorizedToProcess: true;
}

export interface YouTubeTranscriptionSegment {
  text: string;
  /** Present only when a future provider supplies valid timing. Never invented. */
  startSeconds?: number;
}

/** Provenance for a future KAE machine transcription result. */
export interface KaeMachineTranscriptionProvenance {
  kind: 'kae_machine_transcription';
  provider: string;
  modelVersion: string;
  mediaFingerprint: string;
  authorizationId: string;
  authorizedAt: string;
  transcribedAt?: string;
  /** True only when upstream/provider segments include timing. */
  hasProviderTimestamps: boolean;
  /** Explicit machine-transcription label for future writers/UI. */
  machineTranscriptionLabel: 'KAE machine transcription';
  segments?: YouTubeTranscriptionSegment[];
}

export interface YouTubeCaptionProvenance {
  kind: 'youtube_creator_captions' | 'youtube_machine_captions';
  videoId: string;
  languageCode?: string;
}

/** Pilot limits — Founder-locked for Approach 2. */
export const YOUTUBE_TRANSCRIPTION_PILOT_LIMITS = Object.freeze({
  maxMinutesPerVideo: 30,
  maxMinutesPerDay: 60,
  maxEstimatedUsdPerDay: 1,
});

export type YouTubeTranscriptionPilotOutcome =
  | 'allowed'
  | 'blocked_video_duration'
  | 'blocked_daily_minutes'
  | 'blocked_daily_cost'
  | 'blocked_duplicate'
  | 'not_authorized';

/** In-memory / fixture ledger entry — never stores raw media or file paths. */
export type YouTubeTranscriptionIdempotencyState = 'completed' | 'failed';

export interface YouTubeTranscriptionIdempotencyRecord {
  key: string;
  state: YouTubeTranscriptionIdempotencyState;
  /** Optional metadata free of secrets/paths/media. */
  detail?: string;
}

export interface YouTubeTranscriptionIdempotencyParts {
  videoId: string;
  mediaFingerprint: string;
  provider: string;
  modelVersion: string;
}

export interface EvaluatePilotTranscriptionInput {
  authorization?: YouTubeTranscriptionAuthorization | null;
  videoId: string;
  /** Precomputed content hash only — A2a never reads media. */
  mediaFingerprint: string;
  provider: string;
  modelVersion: string;
  /** Declared duration of the candidate media, in minutes. */
  mediaDurationMinutes: number;
  /** Fixture: minutes already consumed today (excluding this request). */
  dailyMinutesUsed: number;
  /** Fixture: estimated USD already spent today (excluding this request). */
  dailyEstimatedUsdUsed: number;
  /** Fixture: estimated USD for this candidate transcription. */
  estimatedUsdForRequest: number;
  /** Existing idempotency ledger (fixture or future durable store). */
  ledger?: ReadonlyArray<YouTubeTranscriptionIdempotencyRecord>;
}

export interface EvaluatePilotTranscriptionResult {
  outcome: YouTubeTranscriptionPilotOutcome;
  /** Policy-facing status — never `processing` or `acquired` from A2a. */
  transcriptionStatus: Exclude<YouTubeTranscriptionStatus, 'processing' | 'acquired'>;
  idempotencyKey: string;
  reasons: string[];
}

/** Explicit isolation from connector scheduling / sync. */
export const YOUTUBE_TRANSCRIPTION_INVOCATION = Object.freeze({
  mode: 'on_demand_only' as const,
  scheduledSyncMayInvoke: false,
  connectorSyncMayInvoke: false,
  automaticImportMayInvoke: false,
  applicationStartupMayInvoke: false,
});

const REQUIRED_ATTESTATION_PHRASE =
  'I attest that I am authorized to process this media for transcription in association with the named YouTube video.';

export function youtubeSourceKey(videoId: string): string {
  return `youtube:${videoId}`;
}

/** Default: no grant → unauthorized. */
export function isTranscriptionAuthorized(
  authorization: YouTubeTranscriptionAuthorization | null | undefined,
  videoId: string,
): boolean {
  if (!authorization) return false;
  return validateTranscriptionAuthorization(authorization, videoId).ok;
}

/**
 * Authorization is checked without consulting a model.
 * URL or local file path alone must never authorize.
 */
export function validateTranscriptionAuthorization(
  authorization: YouTubeTranscriptionAuthorization | null | undefined,
  videoId: string,
  insecureHints?: { videoUrl?: string; localFilePath?: string },
): { ok: boolean; status: 'not_authorized' | 'ready'; reasons: string[] } {
  const reasons: string[] = [];

  // Possession of URL/path is explicitly non-authorizing context.
  if (insecureHints?.videoUrl || insecureHints?.localFilePath) {
    // Still require a full grant; hints alone never flip ok.
  }

  if (!authorization) {
    return { ok: false, status: 'not_authorized', reasons: ['No transcription authorization grant'] };
  }

  if (!videoId || authorization.videoId !== videoId) {
    reasons.push('Authorization videoId does not match request');
  }
  if (authorization.sourceKey !== youtubeSourceKey(videoId)) {
    reasons.push('Authorization sourceKey must be youtube:{videoId}');
  }
  if (!authorization.authorizationId?.trim()) {
    reasons.push('authorizationId is required');
  }
  if (!authorization.authorizedAt?.trim()) {
    reasons.push('authorizedAt is required');
  }
  if (authorization.userAttestedAuthorizedToProcess !== true) {
    reasons.push('userAttestedAuthorizedToProcess must be true');
  }
  if (!authorization.attestationStatement?.trim()) {
    reasons.push('attestationStatement is required');
  } else if (authorization.attestationStatement.trim() !== REQUIRED_ATTESTATION_PHRASE) {
    reasons.push('attestationStatement does not match required authorization attestation');
  }

  if (reasons.length > 0) {
    return { ok: false, status: 'not_authorized', reasons };
  }
  return { ok: true, status: 'ready', reasons: [] };
}

/** Build an explicit grant for fixture/future UI — does not persist. */
export function createTranscriptionAuthorization(input: {
  videoId: string;
  authorizationId: string;
  authorizedAt: string;
  attestationStatement?: string;
}): YouTubeTranscriptionAuthorization {
  return {
    videoId: input.videoId,
    sourceKey: youtubeSourceKey(input.videoId),
    authorizationId: input.authorizationId,
    authorizedAt: input.authorizedAt,
    attestationStatement: input.attestationStatement ?? REQUIRED_ATTESTATION_PHRASE,
    userAttestedAuthorizedToProcess: true,
  };
}

export function requiredTranscriptionAttestationPhrase(): string {
  return REQUIRED_ATTESTATION_PHRASE;
}

export function classifyYouTubeCaptionProvenance(
  trackKind: 'asr' | 'standard' | 'creator' | string | undefined,
): YouTubeCaptionProvenance['kind'] {
  if (trackKind === 'asr') return 'youtube_machine_captions';
  return 'youtube_creator_captions';
}

export function buildKaeMachineTranscriptionProvenance(input: {
  provider: string;
  modelVersion: string;
  mediaFingerprint: string;
  authorizationId: string;
  authorizedAt: string;
  transcribedAt?: string;
  segments?: YouTubeTranscriptionSegment[];
}): KaeMachineTranscriptionProvenance {
  const segments = input.segments?.map((segment) => {
    const next: YouTubeTranscriptionSegment = { text: segment.text };
    if (typeof segment.startSeconds === 'number' && Number.isFinite(segment.startSeconds)) {
      next.startSeconds = segment.startSeconds;
    }
    return next;
  });
  const hasProviderTimestamps = Boolean(
    segments?.some((segment) => typeof segment.startSeconds === 'number'),
  );
  return {
    kind: 'kae_machine_transcription',
    provider: input.provider,
    modelVersion: input.modelVersion,
    mediaFingerprint: input.mediaFingerprint,
    authorizationId: input.authorizationId,
    authorizedAt: input.authorizedAt,
    transcribedAt: input.transcribedAt,
    hasProviderTimestamps,
    machineTranscriptionLabel: 'KAE machine transcription',
    ...(segments ? { segments } : {}),
  };
}

export function buildTranscriptionIdempotencyKey(
  parts: YouTubeTranscriptionIdempotencyParts,
): string {
  return [
    youtubeSourceKey(parts.videoId),
    parts.mediaFingerprint,
    parts.provider,
    parts.modelVersion,
  ].join('|');
}

export function findIdempotencyRecord(
  ledger: ReadonlyArray<YouTubeTranscriptionIdempotencyRecord> | undefined,
  key: string,
): YouTubeTranscriptionIdempotencyRecord | undefined {
  return ledger?.find((entry) => entry.key === key);
}

/**
 * Completed keys cannot be billed twice.
 * Failed keys are distinguishable for controlled future retry (not billed).
 */
export function evaluateIdempotency(
  ledger: ReadonlyArray<YouTubeTranscriptionIdempotencyRecord> | undefined,
  key: string,
): 'available' | 'blocked_duplicate' | 'retryable_failed' {
  const existing = findIdempotencyRecord(ledger, key);
  if (!existing) return 'available';
  if (existing.state === 'completed') return 'blocked_duplicate';
  return 'retryable_failed';
}

/** Pure pilot policy — uses fixture estimates only; no pricing/network/media. */
export function evaluatePilotTranscriptionPolicy(
  input: EvaluatePilotTranscriptionInput,
): EvaluatePilotTranscriptionResult {
  const idempotencyKey = buildTranscriptionIdempotencyKey({
    videoId: input.videoId,
    mediaFingerprint: input.mediaFingerprint,
    provider: input.provider,
    modelVersion: input.modelVersion,
  });

  const auth = validateTranscriptionAuthorization(input.authorization, input.videoId);
  if (!auth.ok) {
    return {
      outcome: 'not_authorized',
      transcriptionStatus: 'not_authorized',
      idempotencyKey,
      reasons: auth.reasons,
    };
  }

  if (input.mediaDurationMinutes > YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerVideo) {
    return {
      outcome: 'blocked_video_duration',
      transcriptionStatus: 'skipped',
      idempotencyKey,
      reasons: [
        `Media duration ${input.mediaDurationMinutes}m exceeds per-video limit ${YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerVideo}m`,
      ],
    };
  }

  if (
    input.dailyMinutesUsed + input.mediaDurationMinutes >
    YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerDay
  ) {
    return {
      outcome: 'blocked_daily_minutes',
      transcriptionStatus: 'skipped',
      idempotencyKey,
      reasons: [
        `Daily minutes would exceed limit ${YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxMinutesPerDay}m`,
      ],
    };
  }

  if (
    input.dailyEstimatedUsdUsed + input.estimatedUsdForRequest >
    YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxEstimatedUsdPerDay
  ) {
    return {
      outcome: 'blocked_daily_cost',
      transcriptionStatus: 'skipped',
      idempotencyKey,
      reasons: [
        `Daily estimated spend would exceed $${YOUTUBE_TRANSCRIPTION_PILOT_LIMITS.maxEstimatedUsdPerDay}`,
      ],
    };
  }

  const idem = evaluateIdempotency(input.ledger, idempotencyKey);
  if (idem === 'blocked_duplicate') {
    return {
      outcome: 'blocked_duplicate',
      transcriptionStatus: 'skipped',
      idempotencyKey,
      reasons: ['Completed idempotency key already billed; rebilling blocked'],
    };
  }

  // retryable_failed and available both allow future A2b to proceed.
  return {
    outcome: 'allowed',
    transcriptionStatus: 'ready',
    idempotencyKey,
    reasons:
      idem === 'retryable_failed'
        ? ['Prior failed attempt is retryable and not marked billed']
        : [],
  };
}

/**
 * Sanitize policy/idempotency outputs — strip any accidental path/secret-like fields.
 * A2a helpers never accept raw media; this guards fixture misuse.
 */
export function assertSafePolicyOutput(value: unknown): void {
  const serialized = JSON.stringify(value);
  const forbidden = [
    /"localFilePath"/i,
    /"fileContent"/i,
    /"apiKey"/i,
    /"Authorization"/i,
    /"Bearer\s/i,
    /"rawMedia"/i,
    /"audioBuffer"/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(serialized)) {
      throw new Error(`Unsafe field present in policy output: ${pattern}`);
    }
  }
}

/**
 * Hard guard: scheduled / connector sync must not invoke transcription.
 * Returns false always; acceptance tests assert call sites do not import executors.
 */
export function scheduledSyncMayInvokeTranscription(): boolean {
  return YOUTUBE_TRANSCRIPTION_INVOCATION.scheduledSyncMayInvoke;
}

export function connectorSyncMayInvokeTranscription(): boolean {
  return YOUTUBE_TRANSCRIPTION_INVOCATION.connectorSyncMayInvoke;
}

/**
 * Inert boundary marker — there is intentionally no `runTranscription` /
 * `transcribeMedia` / provider call export in A2a.
 */
export const YOUTUBE_TRANSCRIPTION_A2A_BOUNDARY = Object.freeze({
  checkpoint: 'A2a',
  liveExecution: false,
  processesMedia: false,
  retainsMedia: false,
  callsProviders: false,
  writesArtifacts: false,
});

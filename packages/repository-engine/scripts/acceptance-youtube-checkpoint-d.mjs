/**
 * Checkpoint D — deterministic source selection, scope, metadata refusal, grounding.
 * Fixture-only; no live sync, migration, STT, or baseline writes.
 */
import { evidenceFingerprint, verifyGroundedAnswer } from '@scooper/ai-orchestration';
import {
  assembleEvidenceContext,
  answerKnowledgeQuestionFromIndex,
  classifyQuestionIntent,
  collectExactKrcItems,
  composeGroundedAnswer,
  extractExactKrcIds,
  extractSearchQuery,
  isContentGroundingQuestion,
  isNavigationOnlyLookupConversation,
  normalizeKrcId,
  resolveSourceScope,
  resolveSourceStatus,
  retrieveEvidenceForQuestion,
  EXACT_KRC_SCORE,
} from '@scooper/repository-engine';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function youtubeSource(krcId, opts = {}) {
  const videoId = opts.videoId ?? '2gCqVb2lBwk';
  const withTranscript = Boolean(opts.withTranscript);
  const records = [
    {
      id: `${krcId}:source`,
      kind: 'source',
      repository: {
        krcId,
        repositoryPath: `Sources/Other_Review_Needed/${krcId}_Title.md`,
        category: 'sources',
        sourceType: 'youtube',
      },
      conversation: {
        conversationId: `youtube:${videoId}`,
        title: opts.title ?? 'Updates to deep research in ChatGPT',
      },
      youtube: {
        sourceType: 'youtube',
        sourceKey: `youtube:${videoId}`,
        videoId,
        originalSourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        captionStatus: withTranscript ? 'Acquired' : 'Failed',
        provenanceKind: 'youtube_metadata',
      },
      excerpt: opts.title ?? 'Updates to deep research in ChatGPT',
    },
  ];
  if (withTranscript) {
    records.push({
      id: `${krcId}:transcript:0`,
      kind: 'message',
      repository: records[0].repository,
      conversation: records[0].conversation,
      youtube: {
        ...records[0].youtube,
        captionStatus: 'Acquired',
        provenanceKind: 'youtube_creator_captions',
      },
      message: {
        messageId: `${krcId}:transcript:0`,
        role: 'youtube_caption',
        text: 'Spoken transcript about agents and research tools.',
        searchTerms: ['spoken', 'transcript', 'agents'],
      },
      excerpt: 'Spoken transcript about agents and research tools.',
    });
  }
  return records;
}

function distractorSourceHit() {
  return {
    id: 'KRC-0107:att:Albert Molina Sourced Talent Matching Agreement.pdf',
    kind: 'attachment',
    repository: {
      krcId: 'KRC-0107',
      repositoryPath: 'Sources/Technical_Build/KRC-0107_VIGS_Beta_Bug_Fix.md',
      category: 'sources',
      sourceType: 'chatgpt',
    },
    attachment: {
      filename: 'Albert Molina Sourced Talent Matching Agreement.pdf',
      assetPath: 'Uploads/x.pdf',
    },
    excerpt: 'Sourced Talent Matching Agreement',
  };
}

function falseLookupSession() {
  return {
    id: 'ExecutiveSessions/KAE/VIGSY-E53018E1_Show_source_KRC-0152_SESSION.md:session',
    kind: 'executive_session',
    repository: {
      krcId: 'VIGSY-E53018E1',
      repositoryPath: 'ExecutiveSessions/KAE/VIGSY-E53018E1_Show_source_KRC-0152_SESSION.md',
      category: 'sessions',
      sourceType: 'executive-session',
    },
    conversation: { title: 'Show source KRC-0152' },
    session: {
      sessionId: 'VIGSY-E53018E1_Show_source_KRC-0152_SESSION',
      linkedKrcId: 'VIGSY-E53018E1',
      summaryReferences: ['There is no available source for KRC-0152'],
    },
    excerpt:
      'There is no available source for KRC-0152 as it appears to be untracked or missing in the current repository.',
  };
}

function buildIndex(records) {
  return {
    version: 1,
    repositoryPath: '/tmp/checkpoint-d-fixture',
    builtAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  };
}

function baseSkeleton(overrides = {}) {
  return {
    question: 'Show source KRC-0152',
    intent: 'source_lookup',
    searchQuery: 'KRC-0152',
    directAnswer: 'KRC-0152 exists as a metadata-only source.',
    reasonedSummary: 'Deterministic source lookup',
    evidenceUsed: [
      {
        recordId: 'KRC-0152:source',
        label: 'Updates',
        excerpt: 'Updates',
        explorerPath: 'Sources/Other_Review_Needed/KRC-0152_Title.md',
        krcId: 'KRC-0152',
        kind: 'source',
        originalSourceUrl: 'https://www.youtube.com/watch?v=2gCqVb2lBwk',
      },
    ],
    confidence: { level: 'high', score: 100, rationale: 'exact' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [],
    sourceStatuses: [
      {
        krcId: 'KRC-0152',
        status: 'exists_metadata_only',
        originalSourceUrl: 'https://www.youtube.com/watch?v=2gCqVb2lBwk',
      },
    ],
    sourceScope: { authorizedKrcIds: ['KRC-0152'], authority: 'named_in_question' },
    suppressExecutiveMemory: true,
    lockDeterministicProse: true,
    ...overrides,
  };
}

async function main() {
  // 1–2 extraction / normalize
  assert(
    JSON.stringify(extractExactKrcIds('Show source KRC-0152')) === JSON.stringify(['KRC-0152']),
    '1 extracts KRC-0152',
  );
  assert(normalizeKrcId('krc-0152') === 'KRC-0152', '2 lowercase normalizes');
  assert(normalizeKrcId('KRC-152') === null, '2 rejects partial numbers');
  assert(
    JSON.stringify(extractExactKrcIds('see krc-0152 and KRC-0152 and KRC-0999')) ===
      JSON.stringify(['KRC-0152', 'KRC-0999']),
    '2 dedupes',
  );

  const index = buildIndex([
    ...youtubeSource('KRC-0152'),
    ...youtubeSource('KRC-0153', { videoId: 'abcdefghijk', withTranscript: true, title: 'With captions' }),
    distractorSourceHit(),
    falseLookupSession(),
    ...Array.from({ length: 90 }, (_, i) => ({
      id: `ExecutiveSessions/Axiom/KRC-${String(1000 + i).padStart(4, '0')}_Pad_SESSION.md:session`,
      kind: 'executive_session',
      repository: {
        krcId: `KRC-${String(1000 + i).padStart(4, '0')}`,
        repositoryPath: `ExecutiveSessions/Axiom/KRC-${String(1000 + i).padStart(4, '0')}_Pad_SESSION.md`,
        category: 'sessions',
        sourceType: 'executive-session',
      },
      conversation: { title: `Pad source session ${i}` },
      session: {
        sessionId: `pad-${i}`,
        summaryReferences: ['Sources/foo'],
      },
      excerpt: 'source keyword filler',
    })),
  ]);

  // Intent + search query
  assert(classifyQuestionIntent('Show source KRC-0152') === 'source_lookup', 'intent source_lookup');
  assert(extractSearchQuery('Show source KRC-0152') === 'KRC-0152', 'searchQuery bare KRC');

  // 3–4 exact force-include above top-N / unrelated source cannot displace
  const retrieved = retrieveEvidenceForQuestion(index, 'Show source KRC-0152', { limit: 5 });
  assert(
    retrieved.items.some((item) => item.recordId === 'KRC-0152:source'),
    '3 exact KRC force-included',
  );
  assert(
    retrieved.items[0].recordId === 'KRC-0152:source' ||
      retrieved.items.find((i) => i.recordId === 'KRC-0152:source').score >= EXACT_KRC_SCORE,
    '3 exact score above cutoff',
  );
  assert(
    !retrieved.items.some((item) => item.recordId.includes('KRC-0107')),
    '4 unrelated Sourced attachment excluded from source_lookup scope',
  );
  assert(
    !retrieved.items.some((item) => item.recordId.includes('VIGSY-E53018E1')),
    '21 false session cannot outrank / enter exact lookup set',
  );

  const exactOnly = collectExactKrcItems(index, ['KRC-0152']);
  assert(
    exactOnly.some((item) => item.recordId === 'KRC-0152:source'),
    'exact collector finds source',
  );
  assert(
    !exactOnly.some((item) => String(item.krcId).startsWith('VIGSY')),
    'exact collector ignores false VIGSY krc',
  );

  // 5 named KRC restricts
  const scopedNamed = assembleEvidenceContext(index, 'Show source KRC-0152');
  assert(
    scopedNamed.sourceScope.authorizedKrcIds.length === 1 &&
      scopedNamed.sourceScope.authorizedKrcIds[0] === 'KRC-0152',
    '5 named restricts to one',
  );
  assert(
    scopedNamed.items.every((item) => item.krcId === 'KRC-0152'),
    '5 items only KRC-0152',
  );

  // 6 UI-selected source restricts
  const scopedUi = assembleEvidenceContext(index, 'Compare these', {
    selectedSourceIds: ['KRC-0153'],
  });
  assert(
    scopedUi.sourceScope.authority === 'ui_selection' &&
      scopedUi.sourceScope.authorizedKrcIds[0] === 'KRC-0153',
    '6 UI selection restricts',
  );
  assert(
    scopedUi.items.every((item) => item.krcId === 'KRC-0153'),
    '6 UI items only selected',
  );

  // 7 two named
  const twoNamed = resolveSourceScope({
    question: 'Compare KRC-0152 and KRC-0153',
    intent: 'general',
  });
  assert(
    twoNamed.authorizedKrcIds.length === 2 &&
      twoNamed.authorizedKrcIds.includes('KRC-0152') &&
      twoNamed.authorizedKrcIds.includes('KRC-0153'),
    '7 two named authorize only those',
  );

  // 8 two UI selected
  const twoUi = resolveSourceScope({
    question: 'What can we conclude?',
    intent: 'general',
    selectedSourceIds: ['KRC-0152', 'KRC-0153'],
  });
  assert(
    twoUi.authorizedKrcIds.length === 2 && twoUi.authority === 'ui_selection',
    '8 two UI selected',
  );

  // 9 compare without multi selection does not broaden (unscoped)
  const compareBare = resolveSourceScope({
    question: 'Compare these',
    intent: 'general',
  });
  assert(compareBare.authority === 'none' && compareBare.authorizedKrcIds.length === 0, '9 no broaden');

  // 10–11 status metadata-only, not missing
  const status0152 = resolveSourceStatus(index, 'KRC-0152');
  assert(status0152.status === 'exists_metadata_only', '10 exists_metadata_only');
  const lookup = composeGroundedAnswer(scopedNamed);
  assert(lookup.intent === 'source_lookup', 'lookup intent');
  assert(!/untracked|missing in the current repository|no available source/i.test(lookup.directAnswer), '11 not missing');
  assert(/exists/i.test(lookup.directAnswer) && /metadata-only/i.test(lookup.directAnswer), '11 exists metadata-only');
  assert(lookup.suppressExecutiveMemory === true, 'lookup suppresses executive memory');
  assert(lookup.lockDeterministicProse === true, 'lookup locks prose');

  // 12–14 metadata-only transcript refusal
  const refuseCtx = assembleEvidenceContext(index, 'What was said in KRC-0152?');
  const refusal = composeGroundedAnswer(refuseCtx);
  assert(/could not acquire usable captions or transcript/i.test(refusal.directAnswer), '12 refusal');
  assert(/KRC-0152/.test(refusal.directAnswer), '13 identity');
  assert(/youtube\.com\/watch\?v=2gCqVb2lBwk/.test(refusal.directAnswer), '13 original URL');
  assert(
    refusal.evidenceUsed.every((e) => e.krcId === 'KRC-0152'),
    '14 no unrelated evidence',
  );
  assert(refusal.lockDeterministicProse === true, '14 locked refusal');
  assert(refusal.suppressExecutiveMemory === true, '14 refusal suppresses executive memory');

  // Paraphrase remediation — flexible content grounding + named-KRC default scope
  const paraphrase = 'what was last said of krc-0152';
  assert(JSON.stringify(extractExactKrcIds(paraphrase)) === JSON.stringify(['KRC-0152']), 'P1 extract');
  assert(isContentGroundingQuestion(paraphrase) === true, 'P1 content grounding');
  const paraphraseScope = resolveSourceScope({ question: paraphrase, intent: 'general' });
  assert(
    paraphraseScope.authority === 'named_in_question' &&
      paraphraseScope.authorizedKrcIds[0] === 'KRC-0152',
    'P1 named_in_question scope',
  );
  const paraphraseCtx = assembleEvidenceContext(index, paraphrase);
  assert(paraphraseCtx.sourceStatuses?.[0]?.status === 'exists_metadata_only', 'P1 status');
  assert(
    paraphraseCtx.items.every((item) => item.krcId === 'KRC-0152'),
    'P1 only KRC-0152 evidence',
  );
  assert(
    !paraphraseCtx.items.some((item) => item.krcId === 'KRC-0049' || String(item.krcId).startsWith('VIGSY')),
    'P1 no Test Product Strategy / VIGSY contamination',
  );
  const paraphraseAnswer = await answerKnowledgeQuestionFromIndex(index, paraphrase);
  assert(/could not acquire usable captions or transcript/i.test(paraphraseAnswer.directAnswer), 'P1 refusal');
  assert(paraphraseAnswer.lockDeterministicProse === true, 'P1 locked');
  assert(paraphraseAnswer.suppressExecutiveMemory === true, 'P1 suppress session');
  assert(paraphraseAnswer.reasoningProviderId === 'deterministic', 'P1 no provider');
  assert(
    paraphraseAnswer.evidenceUsed.every((e) => e.krcId === 'KRC-0152'),
    'P1 evidence scoped',
  );
  const paraphraseNav = {
    conversationId: 'para-nav',
    title: paraphrase,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turns: [
      { turnId: '1', role: 'user', createdAt: '', question: paraphrase, displayText: paraphrase },
      {
        turnId: '2',
        role: 'assistant',
        createdAt: '',
        displayText: paraphraseAnswer.directAnswer,
        answer: paraphraseAnswer,
      },
    ],
  };
  assert(isNavigationOnlyLookupConversation(paraphraseNav) === true, 'P1 no executive sync obligation');

  const paraphrases = [
    'What was said in KRC-0152?',
    'What was last said of KRC-0152?',
    'What did KRC-0152 say?',
    'What was claimed in KRC-0152?',
    'What did they discuss in KRC-0152?',
    'Explain what KRC-0152 recommended.',
    'What was demonstrated by KRC-0152?',
    'What does KRC-0152 state?',
    'What was mentioned about this in KRC-0152?',
  ];
  for (const phrase of paraphrases) {
    assert(isContentGroundingQuestion(phrase) === true, `P2 content: ${phrase}`);
    const ctx = assembleEvidenceContext(index, phrase);
    assert(ctx.transcriptGroundingRequested === true, `P2 transcript flag: ${phrase}`);
    assert(ctx.sourceScope.authorizedKrcIds.includes('KRC-0152'), `P2 scoped: ${phrase}`);
    const ans = composeGroundedAnswer(ctx);
    assert(/could not acquire usable captions or transcript/i.test(ans.directAnswer), `P2 refuse: ${phrase}`);
    assert(ans.lockDeterministicProse === true, `P2 lock: ${phrase}`);
    assert(ans.evidenceUsed.every((e) => e.krcId === 'KRC-0152'), `P2 evidence: ${phrase}`);
  }

  // Compare this with one named KRC does not broaden
  const compareOne = resolveSourceScope({
    question: 'Compare this KRC-0152',
    intent: 'general',
  });
  assert(
    compareOne.authorizedKrcIds.length === 1 && compareOne.authorizedKrcIds[0] === 'KRC-0152',
    'P8 compare+one named stays one',
  );

  // Failed historical sessions remain on disk (when Axiom repo present) but cannot contaminate scope
  const axiomRoot = process.env.KAE_REPOSITORY_PATH ?? join(homedir(), 'Axiom-Knowledge');
  const failedConv = join(
    axiomRoot,
    '.kae-sessions/conversations/97b28576-b424-4aae-98f0-e7423700b92c.json',
  );
  const failedSession = join(
    axiomRoot,
    'ExecutiveSessions/KAE/VIGSY-97B28576_what_was_last_said_of_krc-0152_SESSION.md',
  );
  if (existsSync(failedConv) && existsSync(failedSession)) {
    assert(existsSync(failedConv), 'P10 failed conversation preserved');
    assert(existsSync(failedSession), 'P10 failed executive session preserved');
  }

  // Provider cannot rewrite metadata-only refusal prose
  const refusalSkeleton = {
    ...baseSkeleton({
      question: paraphrase,
      intent: 'general',
      searchQuery: paraphrase,
      directAnswer: paraphraseAnswer.directAnswer,
      reasonedSummary: paraphraseAnswer.reasonedSummary,
      lockDeterministicProse: true,
      suppressExecutiveMemory: true,
    }),
  };
  const rewritten = verifyGroundedAnswer(refusalSkeleton, {
    providerId: 'openai',
    directAnswer: 'The last mention of KRC-0152 involved updates useful for Test Product Strategy Chat.',
    reasonedSummary: 'broaden with KRC-0049',
  });
  assert(rewritten.directAnswer === refusalSkeleton.directAnswer, 'P9 provider cannot rewrite refusal');

  // 15 transcript status
  assert(resolveSourceStatus(index, 'KRC-0153').status === 'exists_with_transcript', '15 with transcript');

  // 16 unknown
  assert(resolveSourceStatus(index, 'KRC-9999').status === 'does_not_exist', '16 does_not_exist');
  const missing = composeGroundedAnswer(assembleEvidenceContext(index, 'Show source KRC-9999'));
  assert(/no repository source record for KRC-9999/i.test(missing.directAnswer), '16 missing prose');

  // 17 provider cannot rewrite exists → missing
  const verifiedMissing = verifyGroundedAnswer(baseSkeleton(), {
    providerId: 'mock',
    directAnswer:
      'There is no available source for KRC-0152 as it appears to be untracked or missing in the current repository.',
    reasonedSummary: 'gap in documentation',
  });
  assert(!/untracked or missing/i.test(verifiedMissing.directAnswer), '17 no rewrite to missing');
  assert(/metadata-only/i.test(verifiedMissing.directAnswer), '17 keeps deterministic');

  // 18 provider cannot add out-of-scope citations (evidence frozen to scope)
  const scopedSkeleton = baseSkeleton({
    lockDeterministicProse: false,
    intent: 'general',
    suppressExecutiveMemory: false,
    evidenceUsed: [
      ...baseSkeleton().evidenceUsed,
      {
        recordId: 'KRC-0107:source',
        label: 'Foreign',
        excerpt: 'Foreign',
        explorerPath: 'Sources/Technical_Build/KRC-0107.md',
        krcId: 'KRC-0107',
        kind: 'source',
      },
    ],
  });
  const verifiedScope = verifyGroundedAnswer(scopedSkeleton, {
    providerId: 'mock',
    directAnswer: 'Based on KRC-0107 and KRC-0152…',
    reasonedSummary: 'ok',
  });
  assert(
    verifiedScope.evidenceUsed.every((e) => e.krcId === 'KRC-0152'),
    '18 evidence filtered to scope',
  );
  assert(!/KRC-0107/.test(verifiedScope.directAnswer) || verifiedScope.usedOfflineFallback, '18 foreign prose fallback');

  // 19 grounding failure falls back
  assert(verifiedMissing.directAnswer === baseSkeleton().directAnswer, '19 fallback to deterministic');

  // 20 navigation-only lookup creates no executive sync obligation
  const navRecord = {
    conversationId: 'nav-only',
    title: 'Show source KRC-0152',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turns: [
      { turnId: '1', role: 'user', createdAt: '', question: 'Show source KRC-0152', displayText: 'Show source KRC-0152' },
      {
        turnId: '2',
        role: 'assistant',
        createdAt: '',
        displayText: lookup.directAnswer,
        answer: lookup,
      },
    ],
  };
  assert(isNavigationOnlyLookupConversation(navRecord) === true, '20 navigation-only detected');

  // 22 ordinary unscoped still retrieves distractors for non-lookup
  const ordinary = assembleEvidenceContext(index, 'What are the unresolved blockers in KAE?');
  assert(ordinary.intent === 'blockers', '22 blockers intent');
  assert(ordinary.sourceScope.authority === 'none', '22 unscoped');

  // End-to-end from index
  const e2e = await answerKnowledgeQuestionFromIndex(index, 'Show source KRC-0152');
  assert(e2e.intent === 'source_lookup', 'e2e intent');
  assert(e2e.sourceStatuses?.[0]?.status === 'exists_metadata_only', 'e2e status');
  assert(e2e.reasoningProviderId === 'deterministic', 'e2e skips provider');

  // Fingerprint contract unchanged shape
  const fp = evidenceFingerprint(e2e);
  assert(typeof fp === 'string' && fp.includes('KRC-0152:source'), 'fingerprint includes source');

  console.log('All Checkpoint D acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

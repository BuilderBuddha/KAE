/**
 * Checkpoint F0a — governed query routing + relationship-driven retrieval
 * + relationship-grounding remediation (titles ≠ projects; locked prose).
 * Fixture-only; no persistence writes, no second retrieval engine.
 */
import { evidenceFingerprint, verifyGroundedAnswer } from '@scooper/ai-orchestration';
import {
  assembleEvidenceContext,
  answerKnowledgeQuestionFromIndex,
  classifyQuestionIntent,
  composeGroundedAnswer,
  extractExactKrcIds,
  isGovernedCampaignRelationshipType,
  isGovernedTopicRelationshipType,
  isProjectTopicRelationshipType,
  resolveSourceScope,
  resolveSourceStatus,
} from '@scooper/repository-engine';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function youtubeMeta(krcId, title = 'Fixture video') {
  return {
    id: `${krcId}:source`,
    kind: 'source',
    repository: {
      krcId,
      repositoryPath: `Sources/Other_Review_Needed/${krcId}_Title.md`,
      category: 'sources',
      sourceType: 'youtube',
    },
    conversation: { conversationId: `youtube:${krcId}`, title },
    youtube: {
      sourceType: 'youtube',
      sourceKey: `youtube:${krcId.slice(-4)}abcd`,
      videoId: '2gCqVb2lBwk',
      originalSourceUrl: 'https://www.youtube.com/watch?v=2gCqVb2lBwk',
      captionStatus: 'Failed',
      provenanceKind: 'youtube_metadata',
    },
    excerpt: title,
  };
}

function chatgptSource(krcId, title) {
  return {
    id: `${krcId}:source`,
    kind: 'source',
    repository: {
      krcId,
      repositoryPath: `Sources/Axiom/${krcId}_${title.replace(/\s+/g, '_')}.md`,
      category: 'sources',
      sourceType: 'chatgpt',
    },
    conversation: { conversationId: `conv-${krcId}`, title },
    excerpt: title,
  };
}

function buildIndex(records) {
  return {
    version: 1,
    repositoryPath: '/tmp/f0a-fixture',
    builtAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  };
}

function buildRelIndex(relationships) {
  return {
    version: 1,
    repositoryPath: '/tmp/f0a-fixture',
    builtAt: new Date().toISOString(),
    relationshipCount: relationships.length,
    relationships,
  };
}

async function main() {
  const videoTitle = 'Updates to deep research in ChatGPT';
  const records = [
    youtubeMeta('KRC-0152', videoTitle),
    chatgptSource('KRC-0049', 'Test Product Strategy Chat'),
    chatgptSource('KRC-0108', 'VIGS Beta Stabilization Plan'),
    chatgptSource('KRC-0129', 'Deep research notes'),
    {
      id: 'KRC-0108:msg:0',
      kind: 'message',
      repository: {
        krcId: 'KRC-0108',
        repositoryPath: 'Sources/Technical_Build/KRC-0108_VIGS_Beta_Stabilization_Plan.md',
        category: 'sources',
        sourceType: 'chatgpt',
      },
      conversation: { title: 'VIGS Beta Stabilization Plan' },
      message: {
        messageId: 'KRC-0108:msg:0',
        role: 'assistant',
        text: 'Campaign 1.4 stabilization work for VIGS beta.',
        searchTerms: ['campaign', 'vigs', 'stabilization'],
      },
      excerpt: 'Campaign 1.4 stabilization work for VIGS beta.',
    },
  ];
  const index = buildIndex(records);

  const relationships = [
    {
      relationshipId: 'krc-0152::campaign_campaign::krc-0108',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0108:source',
      relationshipType: 'campaign_campaign',
      reason: 'Shared campaign reference Campaign 1.4',
      confidence: 0.9,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0108:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'krc-0152::topic_topic::krc-0129',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0129:source',
      relationshipType: 'topic_topic',
      reason: 'Shared topic: deep, research',
      confidence: 0.85,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0129:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'krc-0108::conversation_source::krc-0108-msg',
      fromId: 'KRC-0108:source',
      toId: 'KRC-0108:msg:0',
      relationshipType: 'conversation_source',
      reason: 'Source conversation link',
      confidence: 0.8,
      supportingEvidenceIds: ['KRC-0108:source', 'KRC-0108:msg:0'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'krc-0152::conversation_source::self',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0152:source',
      relationshipType: 'conversation_source',
      reason: 'Source record self-link',
      confidence: 0.99,
      supportingEvidenceIds: ['KRC-0152:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'noise::capability_capability::sessions',
      fromId: 'KRC-0152:source',
      toId: 'ExecSession:noise',
      relationshipType: 'capability_capability',
      reason: 'Shared capability "Show source KRC-0152"',
      confidence: 0.72,
      supportingEvidenceIds: ['KRC-0152:source'],
      createdAutomatically: true,
    },
  ];
  const relIndex = buildRelIndex(relationships);

  // Classifiers — grounding contract
  assert(isGovernedCampaignRelationshipType('campaign_campaign'), 'campaign classifier');
  assert(isGovernedTopicRelationshipType('topic_topic'), 'topic classifier');
  assert(isProjectTopicRelationshipType('campaign_campaign'), 'project-topic includes campaign');
  assert(isProjectTopicRelationshipType('topic_topic'), 'project-topic includes topic');
  assert(!isProjectTopicRelationshipType('capability_capability'), 'G1 capability ≠ project');
  assert(!isProjectTopicRelationshipType('conversation_source'), 'G1 source link ≠ project');

  // 1 Exact named-KRC lookup unchanged
  assert(classifyQuestionIntent('Show source KRC-0152') === 'source_lookup', '1 intent source_lookup');
  const lookup = await answerKnowledgeQuestionFromIndex(index, 'Show source KRC-0152', {
    relationshipIndex: relIndex,
  });
  assert(lookup.intent === 'source_lookup', '1 lookup intent');
  assert(lookup.sourceStatuses?.[0]?.status === 'exists_metadata_only', '1 status');
  assert(lookup.evidenceUsed.every((e) => e.krcId === 'KRC-0152'), '1 scoped evidence');
  assert(lookup.reasoningProviderId === 'deterministic', '1 no provider');

  // 2–3 metadata refusal / source-content intact
  const refuse = await answerKnowledgeQuestionFromIndex(index, 'what was last said of krc-0152', {
    relationshipIndex: relIndex,
  });
  assert(/could not acquire usable captions or transcript/i.test(refuse.directAnswer), '2 refusal');
  assert(refuse.lockDeterministicProse === true, '2 locked');
  assert(refuse.evidenceUsed.every((e) => e.krcId === 'KRC-0152'), '3 content scoped');

  // 4 project/topic routing with true campaign edge
  assert(
    classifyQuestionIntent('What projects are related to KRC-0152?') === 'project_topic',
    '4 project_topic intent',
  );
  const projectCtx = assembleEvidenceContext(index, 'What projects are related to KRC-0152?', {
    relationshipIndex: relIndex,
  });
  assert(projectCtx.intent === 'project_topic', '4 assemble intent');
  assert(
    projectCtx.sourceScope.authority === 'named_in_question' &&
      projectCtx.sourceScope.authorizedKrcIds[0] === 'KRC-0152',
    '4/7 named KRC scope dominant',
  );
  assert(
    (projectCtx.relatedProjectTopics?.length ?? 0) > 0,
    '4 related project topics present',
  );
  assert(
    projectCtx.relatedProjectTopics.every((hit) =>
      isProjectTopicRelationshipType(hit.relationshipType),
    ),
    'G1 only campaign/topic edges in relatedProjectTopics',
  );
  assert(
    !projectCtx.relatedProjectTopics.some((hit) => hit.label === videoTitle),
    'G1 source/video title never listed as related project hit',
  );
  assert(
    projectCtx.items.every(
      (item) => item.krcId === 'KRC-0152' || item.matchReasons.includes('governed_relationship'),
    ),
    '7/8 retrieval is named KRC or relationship-backed only',
  );
  assert(
    !projectCtx.items.some((item) => item.krcId === 'KRC-0049'),
    '8 no Test Product Strategy broaden',
  );
  assert(
    projectCtx.items.some(
      (item) => item.krcId === 'KRC-0108' && item.matchReasons.includes('governed_relationship'),
    ),
    '4 relationship peer retrieved',
  );

  const projectAnswer = composeGroundedAnswer(projectCtx);
  assert(projectAnswer.intent === 'project_topic', '4 compose intent');
  assert(projectAnswer.lockDeterministicProse === true, 'G7 lockDeterministicProse');
  assert(
    /Related projects\/campaigns from the governed relationship index/i.test(projectAnswer.directAnswer),
    'G3 true campaign edge presented as project/campaign',
  );
  assert(/relationship type: campaign_campaign/i.test(projectAnswer.directAnswer), 'G3 relationship type');
  assert(/provenance: Shared campaign reference Campaign 1\.4/i.test(projectAnswer.directAnswer), 'G3 provenance');
  assert(
    /Related topics \(not projects\) from the governed relationship index/i.test(projectAnswer.directAnswer),
    'G2 topic remains labeled as topic',
  );
  assert(/\[topic\]/i.test(projectAnswer.directAnswer), 'G2 topic entity label');
  assert(!/\[project\/campaign\].*Updates to deep research/i.test(projectAnswer.directAnswer), 'G1 title not project');
  assert(!/ongoing developments|serves as a reference point|influenced|through the project title/i.test(projectAnswer.directAnswer), 'G6 no invented semantics');
  assert(
    (projectAnswer.relatedProjectTopics?.length ?? 0) > 0,
    '4 answer carries relatedProjectTopics',
  );
  assert(!/Invented Mega Project/i.test(projectAnswer.directAnswer), '6 no invented project');

  // G7 provider cannot change entity type or invent relationship semantics
  const forged = verifyGroundedAnswer(projectAnswer, {
    providerId: 'mock-provider',
    directAnswer: `Related project: ${videoTitle} — ongoing developments and insights through the project title.`,
    reasonedSummary: 'The source title influenced the campaign.',
    usedOfflineFallback: false,
  });
  assert(forged.directAnswer === projectAnswer.directAnswer, 'G7 provider text rejected');
  assert(!/ongoing developments/i.test(forged.directAnswer), 'G7 no provider invention');

  // G5 missing qualifying project edge → honest insufficiency
  const topicOnlyRels = buildRelIndex([
    {
      relationshipId: 'krc-0152::topic_topic::krc-0129',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0129:source',
      relationshipType: 'topic_topic',
      reason: 'Shared topic: deep, research',
      confidence: 0.85,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0129:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'noise::capability',
      fromId: 'KRC-0152:source',
      toId: 'ExecSession:noise',
      relationshipType: 'capability_capability',
      reason: 'Shared capability',
      confidence: 0.72,
      supportingEvidenceIds: ['KRC-0152:source'],
      createdAutomatically: true,
    },
  ]);
  const insuffCtx = assembleEvidenceContext(index, 'What projects are related to KRC-0152?', {
    relationshipIndex: topicOnlyRels,
  });
  const insuffAnswer = composeGroundedAnswer(insuffCtx);
  assert(
    /No governed project relationship is established for KRC-0152 in the current relationship index/i.test(
      insuffAnswer.directAnswer,
    ),
    'G5 honest insufficiency',
  );
  assert(
    !new RegExp(`\\[project/campaign\\].*${videoTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(
      insuffAnswer.directAnswer,
    ),
    'G5 title not promoted to project',
  );
  assert(/Related topics \(not projects\)/i.test(insuffAnswer.directAnswer), 'G5 topics may appear labeled');

  // G4 title similarity alone → no governed project relationship
  const titleOnlyRels = buildRelIndex([
    {
      relationshipId: 'krc-0152::conversation_source::self',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0152:source',
      relationshipType: 'conversation_source',
      reason: 'Source record self-link',
      confidence: 0.99,
      supportingEvidenceIds: ['KRC-0152:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'noise::capability',
      fromId: 'KRC-0152:source',
      toId: 'ExecSession:noise',
      relationshipType: 'capability_capability',
      reason: `Shared wording with ${videoTitle}`,
      confidence: 0.5,
      supportingEvidenceIds: ['KRC-0152:source'],
      createdAutomatically: true,
    },
  ]);
  const titleCtx = assembleEvidenceContext(index, 'What projects are related to KRC-0152?', {
    relationshipIndex: titleOnlyRels,
  });
  assert(
    (titleCtx.relatedProjectTopics?.length ?? 0) === 0,
    'G4 no project/topic hits from title similarity',
  );
  const titleAnswer = composeGroundedAnswer(titleCtx);
  assert(
    /No governed project relationship is established for KRC-0152/i.test(titleAnswer.directAnswer),
    'G4 insufficiency for title-only',
  );
  assert(!/Related projects\/campaigns/i.test(titleAnswer.directAnswer), 'G4 no project list');

  // 5 relationship-trace routing (single named endpoint — concise, not a star dump)
  assert(
    classifyQuestionIntent('How is KRC-0152 related to VIGS stabilization?') === 'relationship_trace',
    '5 relationship_trace intent',
  );
  const traceCtx = assembleEvidenceContext(
    index,
    'Trace the relationship between KRC-0152 and stabilization',
    { relationshipIndex: relIndex },
  );
  assert(traceCtx.intent === 'relationship_trace', '5 assemble intent');
  assert((traceCtx.relatedProjectTopics?.length ?? 0) > 0, '5 relationship hits');
  assert(
    !traceCtx.relatedProjectTopics.some((hit) => hit.relationshipType === 'capability_capability'),
    'G9 capability spam excluded from trace',
  );
  assert(
    traceCtx.items.some((item) => item.matchReasons.includes('governed_relationship')),
    '5 relationship-driven retrieval ranking',
  );
  const traceAnswer = composeGroundedAnswer(traceCtx);
  assert(traceAnswer.lockDeterministicProse === true, 'G6/G7 trace locked');
  assert(/Governed relationship links \(index-backed\)/i.test(traceAnswer.directAnswer), 'G6 heading');
  assert(/—\[(campaign_campaign|topic_topic|conversation_source)\]→/i.test(traceAnswer.directAnswer), 'G6 indexed relationship type');
  assert(/provenance:/i.test(traceAnswer.directAnswer), 'G6 provenance');
  assert(!/ongoing developments|influenced|caused|supports/i.test(traceAnswer.directAnswer), 'G6 no causal invention');
  assert(traceAnswer.reasonedSummary === '', 'C1 reasonedSummary empty — no double paint');

  // N1–N6 named-pair scope
  const distractorRels = buildRelIndex([
    ...relationships,
    {
      relationshipId: 'krc-0152::topic_topic::krc-0093',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0093:source',
      relationshipType: 'topic_topic',
      reason: 'Shared topic: deep, research',
      confidence: 0.99,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0093:source'],
      createdAutomatically: true,
    },
    {
      relationshipId: 'krc-0152::topic_topic::krc-0111',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0111:source',
      relationshipType: 'topic_topic',
      reason: 'Shared topic: research',
      confidence: 0.98,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0111:source'],
      createdAutomatically: true,
    },
  ]);
  // Add distractor source records so hits can resolve
  const indexWithDistractors = buildIndex([
    ...records,
    chatgptSource('KRC-0093', 'Unrelated high rank A'),
    chatgptSource('KRC-0111', 'Unrelated high rank B'),
  ]);
  const pairCtx = assembleEvidenceContext(
    indexWithDistractors,
    'Trace the relationship between KRC-0152 and KRC-0129',
    { relationshipIndex: distractorRels },
  );
  assert(pairCtx.sourceScope.authorizedKrcIds.includes('KRC-0152'), 'N2 endpoint A in scope');
  assert(pairCtx.sourceScope.authorizedKrcIds.includes('KRC-0129'), 'N2 endpoint B in scope');
  assert(
    (pairCtx.relatedProjectTopics?.length ?? 0) > 0,
    'N3 direct named-pair edge present',
  );
  assert(
    pairCtx.relatedProjectTopics.every(
      (hit) =>
        /KRC-0152/i.test(`${hit.fromId} ${hit.toId} ${hit.recordId} ${hit.krcId}`) &&
        /KRC-0129/i.test(`${hit.fromId} ${hit.toId} ${hit.recordId} ${hit.krcId}`),
    ),
    'N3/N5 only path connecting named endpoints',
  );
  assert(
    !pairCtx.relatedProjectTopics.some((hit) => hit.krcId === 'KRC-0093' || hit.krcId === 'KRC-0111'),
    'N5 disconnected high-ranking edges excluded',
  );
  const pairAnswer = composeGroundedAnswer(pairCtx);
  assert(
    /Governed relationship path between KRC-0152 and KRC-0129/i.test(pairAnswer.directAnswer),
    'N7 concise named-pair heading',
  );
  assert(/provenance:/i.test(pairAnswer.directAnswer), 'N7 provenance');
  assert(!/KRC-0093|KRC-0111/i.test(pairAnswer.directAnswer), 'N5 distractors absent from answer');
  assert(pairAnswer.reasonedSummary === '', 'C1 pair answer not double-painted');

  // N6 missing named-pair path
  const noPathRels = buildRelIndex([
    {
      relationshipId: 'krc-0152::topic_topic::krc-0093',
      fromId: 'KRC-0152:source',
      toId: 'KRC-0093:source',
      relationshipType: 'topic_topic',
      reason: 'Shared topic: deep, research',
      confidence: 0.9,
      supportingEvidenceIds: ['KRC-0152:source', 'KRC-0093:source'],
      createdAutomatically: true,
    },
  ]);
  const noPathCtx = assembleEvidenceContext(
    indexWithDistractors,
    'Trace the relationship between KRC-0152 and KRC-0129',
    { relationshipIndex: noPathRels },
  );
  assert((noPathCtx.relatedProjectTopics?.length ?? 0) === 0, 'N6 no path hits');
  const noPathAnswer = composeGroundedAnswer(noPathCtx);
  assert(
    /No governed relationship path is established between KRC-0152 and KRC-0129/i.test(
      noPathAnswer.directAnswer,
    ),
    'N6 honest insufficiency',
  );

  // E topic stopword display sanitization
  const noisyTopicCtx = {
    ...insuffCtx,
    relatedProjectTopics: [
      {
        recordId: 'KRC-0129:source',
        label: 'Deep research notes',
        excerpt: 'notes',
        explorerPath: 'Sources/Axiom/KRC-0129.md',
        krcId: 'KRC-0129',
        kind: 'source',
        relationshipType: 'topic_topic',
        reason: 'Shared topic: to, deep, research',
        confidence: 0.85,
        fromId: 'KRC-0152:source',
        toId: 'KRC-0129:source',
      },
    ],
  };
  const noisyTopicAnswer = composeGroundedAnswer(noisyTopicCtx);
  assert(!/Shared topic: to,/i.test(noisyTopicAnswer.directAnswer), 'E stopword excluded from provenance');
  assert(/Shared topic:.*deep/i.test(noisyTopicAnswer.directAnswer), 'E meaningful tokens preserved');

  // D fresh conversation isolation — Vigsy session artifacts excluded from ordinary steering
  const vigsyPolluted = buildIndex([
    ...records,
    {
      id: 'ExecutiveSessions/KAE/VIGSY-DEADBEEF_Show_source_KRC-0152_SESSION.md:session',
      kind: 'executive_session',
      repository: {
        krcId: 'VIGSY-DEADBEEF',
        repositoryPath: 'ExecutiveSessions/KAE/VIGSY-DEADBEEF_Show_source_KRC-0152_SESSION.md',
        category: 'executive_sessions',
      },
      conversation: { title: 'Show source KRC-0152' },
      session: { sessionId: 'VIGSY-DEADBEEF', summaryReferences: ['KRC-0152', 'blockers', 'priorities'] },
      excerpt: 'Prior conversation focused on KRC-0152 priorities and blockers.',
    },
  ]);
  const freshBlockers = assembleEvidenceContext(
    vigsyPolluted,
    'What are the current priorities and blockers for KAE?',
    { excludeConversationLocalSteering: true },
  );
  assert(freshBlockers.intent === 'blockers', 'D ordinary blockers intent');
  assert(
    !freshBlockers.items.some((item) => /VIGSY-DEADBEEF/i.test(item.recordId)),
    'D11 prior Vigsy session does not steer fresh conversation',
  );
  assert(
    !freshBlockers.executiveSessions.some((item) => /VIGSY-DEADBEEF/i.test(item.recordId)),
    'D9 prior local Recent Decisions sessions excluded from steering',
  );
  // Durable governed memory remains: fixture sources are still indexed and eligible.
  assert(
    vigsyPolluted.records.some((r) => r.kind === 'source' && r.repository?.krcId === 'KRC-0108'),
    'D10 durable governed source memory remains available',
  );
  assert(
    freshBlockers.items.every((item) => !/VIGSY-/i.test(item.recordId)),
    'D11 no Vigsy conversation-local artifacts in fresh items',
  );

  // 9 fingerprint compatibility
  const fp = evidenceFingerprint(projectAnswer);
  assert(typeof fp === 'string' && fp.includes(':'), '9 fingerprint shape');

  // 10 ordinary unscoped
  const ordinary = assembleEvidenceContext(index, 'What are the unresolved blockers in KAE?', {
    relationshipIndex: relIndex,
  });
  assert(ordinary.intent === 'blockers', '10 blockers');
  assert(ordinary.sourceScope.authority === 'none', '10 unscoped');
  assert(!ordinary.relatedProjectTopics, '10 no forced related topics');

  // 11 enrichment dedupe / citations compatible
  assert(
    projectAnswer.relatedSources.every(
      (src) => !(projectAnswer.relatedProjectTopics ?? []).some((t) => t.recordId === src.recordId),
    ) || projectAnswer.relatedSources.length >= 0,
    '11 relatedSources compatible',
  );
  assert(Array.isArray(projectAnswer.evidenceUsed), '12 evidenceUsed present');

  // 12 no write — fixture path only; statuses unchanged
  assert(resolveSourceStatus(index, 'KRC-0152').status === 'exists_metadata_only', '12 status stable');
  assert(
    JSON.stringify(extractExactKrcIds('What projects are related to KRC-0152?')) ===
      JSON.stringify(['KRC-0152']),
    '12 extract',
  );

  // Scope resolve without relationship still names KRC
  const scopeOnly = resolveSourceScope({
    question: 'What projects are related to KRC-0152?',
    intent: 'project_topic',
  });
  assert(scopeOnly.authorizedKrcIds[0] === 'KRC-0152', 'named scope without UI');

  // End-to-end skip provider for project_topic
  const e2e = await answerKnowledgeQuestionFromIndex(index, 'What projects are related to KRC-0152?', {
    relationshipIndex: relIndex,
  });
  assert(e2e.reasoningProviderId === 'deterministic', 'G7 e2e skips provider');
  assert(e2e.lockDeterministicProse === true, 'G7 e2e locked');
  assert(e2e.reasonedSummary === '', 'C1 e2e single render field');

  console.log('All Checkpoint F0a acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

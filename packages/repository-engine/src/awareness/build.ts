import type {
  EvidenceRecord,
  ExecutiveAwarenessCard,
  ExecutiveAwarenessEvidenceLink,
  ExecutiveBriefing,
  KnowledgeRelationship,
  RepositoryHealthIssue,
  RepositoryHealthReport,
} from '@scooper/core';
import { checkRepositoryHealth } from '../health-check.js';
import { getRepositoryStats } from '../stats.js';
import { listChatGptImportEntries } from '../chatgpt-source.js';
import { ensureEvidenceIndex } from '../evidence/search.js';
import { ensureRelationshipIndex } from '../relationships/query.js';
import {
  recordMatchesBlockerTerms,
  recordMatchesDecisionTerms,
} from '../reasoning/intent.js';

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function recordTimestamp(record: EvidenceRecord): number {
  return parseTimestamp(
    record.message?.timestamp ?? record.conversation?.updated ?? record.conversation?.created,
  );
}

function recordText(record: EvidenceRecord): string {
  return [
    record.excerpt,
    record.message?.text,
    record.conversation?.title,
    record.session?.summaryReferences?.join(' '),
  ]
    .filter(Boolean)
    .join(' ');
}

function recordLabel(record: EvidenceRecord): string {
  if (record.kind === 'attachment' && record.attachment) return record.attachment.filename;
  return record.conversation?.title ?? record.repository.krcId ?? record.id;
}

function toEvidenceLink(record: EvidenceRecord): ExecutiveAwarenessEvidenceLink {
  return {
    recordId: record.id,
    label: recordLabel(record),
    explorerPath: record.repository.repositoryPath,
    krcId: record.repository.krcId,
    kind: record.kind,
  };
}

function issueToLink(issue: RepositoryHealthIssue): ExecutiveAwarenessEvidenceLink {
  return {
    label: issue.message,
    explorerPath: issue.relativePath ?? 'Registries/SOURCE_REGISTRY.md',
  };
}

function decisionConfidence(record: EvidenceRecord): number {
  if (record.kind === 'executive_session') return 92;
  if (recordMatchesDecisionTerms(recordText(record))) return 78;
  return 65;
}

function findRecordById(records: EvidenceRecord[], id: string): EvidenceRecord | undefined {
  return (
    records.find((r) => r.id === id) ??
    records.find((r) => r.repository.krcId === id) ??
    records.find((r) => id.startsWith(r.repository.krcId ?? ''))
  );
}

function buildRecentDecisionCard(records: EvidenceRecord[]): ExecutiveAwarenessCard {
  const candidates = records
    .filter((record) => {
      const text = recordText(record);
      return record.kind === 'executive_session' || recordMatchesDecisionTerms(text);
    })
    .sort((a, b) => recordTimestamp(b) - recordTimestamp(a))
    .slice(0, 4);

  const top = candidates[0];
  const confidence = top ? decisionConfidence(top) : 50;

  return {
    cardId: 'recent-decisions',
    category: 'recent_decision',
    title: 'Recent Decisions',
    summary: top
      ? `${recordLabel(top)} — ${top.excerpt.slice(0, 140)}${top.excerpt.length > 140 ? '…' : ''}`
      : 'No indexed decision evidence found yet.',
    whyItMatters:
      'Recent decisions anchor what the team agreed to and what Vigsy can ground answers on.',
    confidence,
    evidenceLinks: candidates.map(toEvidenceLink),
  };
}

function buildBlockerCard(
  records: EvidenceRecord[],
  health: RepositoryHealthReport,
): ExecutiveAwarenessCard {
  const healthBlockers = health.issues.filter(
    (issue) => issue.severity === 'error' || issue.severity === 'warning',
  );

  const evidenceBlockers = records
    .filter((record) => recordMatchesBlockerTerms(recordText(record)))
    .sort((a, b) => recordTimestamp(b) - recordTimestamp(a))
    .slice(0, 4);

  const links: ExecutiveAwarenessEvidenceLink[] = [
    ...healthBlockers.slice(0, 2).map(issueToLink),
    ...evidenceBlockers.map(toEvidenceLink),
  ];

  const seen = new Set<string>();
  const deduped = links.filter((link) => {
    const key = link.recordId ?? link.explorerPath;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) {
    return {
      cardId: 'recent-blockers',
      category: 'recent_blocker',
      title: 'Blockers',
      summary: 'No critical blockers found in repository health or indexed evidence.',
      whyItMatters: 'A clear blocker picture helps you prioritize without surprise impediments.',
      confidence: 84,
      evidenceLinks: [
        {
          label: 'Repository health status',
          explorerPath: 'Registries/SOURCE_REGISTRY.md',
        },
      ],
      isPlaceholder: true,
    };
  }

  const top = deduped[0];
  return {
    cardId: 'recent-blockers',
    category: 'recent_blocker',
    title: 'Recent Blockers',
    summary: top.label,
    whyItMatters: 'Unresolved blockers can stall campaigns until they are visible and tracked.',
    confidence: healthBlockers.length > 0 ? 90 : 72,
    evidenceLinks: deduped.slice(0, 4),
  };
}

function buildRecentImportCard(
  importEntries: Awaited<ReturnType<typeof listChatGptImportEntries>>,
): ExecutiveAwarenessCard {
  const sorted = [...importEntries].sort((a, b) => b.sortTime.localeCompare(a.sortTime));
  const latest = sorted[0];

  return {
    cardId: 'recent-imports',
    category: 'recent_import',
    title: 'Recent Imports',
    summary: latest
      ? `Latest ChatGPT import: ${latest.title} (${latest.krcId})`
      : 'No ChatGPT imports indexed in the repository.',
    whyItMatters: 'Fresh imports expand the evidence Vigsy can search, relate, and reason over.',
    confidence: latest ? 94 : 60,
    evidenceLinks: sorted.slice(0, 3).map((entry) => ({
      label: `${entry.krcId} — ${entry.title}`,
      explorerPath: entry.relativePath,
      krcId: entry.krcId,
      kind: 'source',
    })),
  };
}

function topicKeyFromRelationship(rel: KnowledgeRelationship): string {
  const match = rel.reason.match(/"([^"]+)"/);
  return match?.[1] ?? rel.reason.replace(/^Shared (topic|campaign reference) /i, '').trim();
}

function buildHighRelationshipTopicCard(
  records: EvidenceRecord[],
  relationships: KnowledgeRelationship[],
): ExecutiveAwarenessCard {
  const topicScores = new Map<string, { count: number; rel: KnowledgeRelationship }>();

  for (const rel of relationships) {
    if (
      rel.relationshipType !== 'campaign_campaign' &&
      rel.relationshipType !== 'topic_topic' &&
      rel.relationshipType !== 'conversation_conversation'
    ) {
      continue;
    }
    const key = topicKeyFromRelationship(rel);
    const existing = topicScores.get(key);
    if (existing) existing.count += 1;
    else topicScores.set(key, { count: 1, rel });
  }

  const ranked = [...topicScores.entries()].sort((a, b) => b[1].count - a[1].count);
  const top = ranked[0];

  if (!top) {
    return {
      cardId: 'high-relationship-topic',
      category: 'high_relationship_topic',
      title: 'High-Relationship Topics',
      summary: 'Relationship index is building cross-evidence links across the repository.',
      whyItMatters: 'Highly connected topics reveal where knowledge clusters and campaigns overlap.',
      confidence: 55,
      evidenceLinks: [],
    };
  }

  const [topic, { count, rel }] = top;
  const peerRecord =
    findRecordById(records, rel.toId) ?? findRecordById(records, rel.fromId) ?? records[0];

  return {
    cardId: 'high-relationship-topic',
    category: 'high_relationship_topic',
    title: 'High-Relationship Topic',
    summary: `"${topic}" appears in ${count} indexed relationships.`,
    whyItMatters:
      'Topics with many relationships are strong anchors for executive awareness and follow-up questions.',
    confidence: Math.min(95, 60 + count * 3),
    evidenceLinks: peerRecord
      ? [toEvidenceLink(peerRecord)]
      : [
          {
            label: rel.reason,
            explorerPath: rel.supportingEvidenceIds[0] ?? 'Registries/SOURCE_REGISTRY.md',
          },
        ],
  };
}

function buildSuggestedNextActionsCard(health: RepositoryHealthReport): ExecutiveAwarenessCard {
  const actions: ExecutiveAwarenessEvidenceLink[] = [];

  for (const issue of health.categorizedIssues.recommendations.slice(0, 3)) {
    actions.push({
      label: issue.recovery ? `${issue.message} — ${issue.recovery}` : issue.message,
      explorerPath: issue.relativePath ?? 'Registries/SOURCE_REGISTRY.md',
    });
  }

  for (const issue of health.issues.filter((i) => i.recovery).slice(0, 3)) {
    if (actions.length >= 4) break;
    actions.push({
      label: `${issue.message} — ${issue.recovery}`,
      explorerPath: issue.relativePath ?? 'Registries/SOURCE_REGISTRY.md',
    });
  }

  if (!health.gitReady) {
    actions.push({
      label: 'Review git readiness before the next import',
      explorerPath: 'Registries/SOURCE_REGISTRY.md',
    });
  }

  if (health.gitDirty) {
    actions.push({
      label: 'Commit or stash uncommitted repository changes',
      explorerPath: 'Registries/SOURCE_REGISTRY.md',
    });
  }

  const seen = new Set<string>();
  const deduped = actions.filter((action) => {
    if (seen.has(action.label)) return false;
    seen.add(action.label);
    return true;
  });

  const fallback =
    deduped.length > 0
      ? deduped
      : [
          {
            label: 'Explore recent evidence with a Vigsy question',
            explorerPath: 'Sources',
          },
        ];

  return {
    cardId: 'suggested-next-actions',
    category: 'suggested_next_action',
    title: 'Suggested Next Actions',
    summary: fallback[0].label,
    whyItMatters: 'Grounded next steps keep momentum without autonomous changes to the repository.',
    confidence: deduped.length > 0 ? 80 : 65,
    evidenceLinks: fallback.slice(0, 4),
  };
}

function buildRepositoryHealthCard(health: RepositoryHealthReport): ExecutiveAwarenessCard {
  const confidence =
    health.statusLevel === 'healthy' ? 93 : health.statusLevel === 'attention' ? 78 : 62;

  return {
    cardId: 'repository-health',
    category: 'repository_health',
    title: 'Repository Health',
    summary: health.statusHeadline,
    whyItMatters: health.statusSubline,
    confidence,
    evidenceLinks:
      health.issues.length > 0
        ? health.issues.slice(0, 4).map(issueToLink)
        : [
            {
              label: 'Repository structure verified',
              explorerPath: 'Registries/SOURCE_REGISTRY.md',
            },
          ],
  };
}

/** Builds a deterministic executive briefing from indexed knowledge signals. */
export async function buildExecutiveBriefing(repositoryPath: string): Promise<ExecutiveBriefing> {
  const [evidenceIndex, relationshipIndex, health, , importEntries] = await Promise.all([
    ensureEvidenceIndex(repositoryPath),
    ensureRelationshipIndex(repositoryPath),
    checkRepositoryHealth(repositoryPath),
    getRepositoryStats(repositoryPath),
    listChatGptImportEntries(repositoryPath),
  ]);

  const cards: ExecutiveAwarenessCard[] = [
    buildRecentDecisionCard(evidenceIndex.records),
    buildBlockerCard(evidenceIndex.records, health),
    buildRecentImportCard(importEntries),
    buildHighRelationshipTopicCard(evidenceIndex.records, relationshipIndex.relationships),
    buildSuggestedNextActionsCard(health),
    buildRepositoryHealthCard(health),
  ];

  return {
    version: 1,
    repositoryPath,
    generatedAt: new Date().toISOString(),
    evidenceRecordCount: evidenceIndex.recordCount,
    relationshipCount: relationshipIndex.relationshipCount,
    cards,
  };
}

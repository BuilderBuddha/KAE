import type { EvidenceIndex, EvidenceRecord, KnowledgeRelationship } from '@scooper/core';
import type { KnowledgeRelationshipType } from '@scooper/core';
import { tokenizeSearchTerms } from '../evidence/tokenize.js';

function slug(value: string): string {
  return value.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function relId(fromId: string, type: KnowledgeRelationshipType, toId: string): string {
  return `${slug(fromId)}::${type}::${slug(toId)}`;
}

function addRelationship(
  relationships: KnowledgeRelationship[],
  seen: Set<string>,
  params: Omit<KnowledgeRelationship, 'relationshipId' | 'createdAutomatically'>,
): void {
  const id = relId(params.fromId, params.relationshipType, params.toId);
  if (seen.has(id)) return;
  seen.add(id);
  relationships.push({ ...params, relationshipId: id, createdAutomatically: true });
}

function recordsByKrc(index: EvidenceIndex): Map<string, EvidenceRecord[]> {
  const map = new Map<string, EvidenceRecord[]>();
  for (const record of index.records) {
    const krc = record.repository.krcId;
    if (!krc) continue;
    const list = map.get(krc) ?? [];
    list.push(record);
    map.set(krc, list);
  }
  return map;
}

function conversationRecord(records: EvidenceRecord[]): EvidenceRecord | undefined {
  return records.find((r) => r.kind === 'conversation') ?? records.find((r) => r.kind === 'source');
}

function titleTokens(record: EvidenceRecord): Set<string> {
  const text = [record.conversation?.title, record.excerpt, record.message?.text].filter(Boolean).join(' ');
  return new Set(tokenizeSearchTerms(text));
}

function sharedTokenCount(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((token) => b.has(token));
}

function extractCampaigns(text: string): string[] {
  const matches = text.match(/Campaign\s+[\d.]+[a-z]?/gi) ?? [];
  return [...new Set(matches.map((m) => m.trim()))];
}

function pairRecordsBySharedTokens(
  records: EvidenceRecord[],
  relationships: KnowledgeRelationship[],
  seen: Set<string>,
  options: {
    relationshipType: KnowledgeRelationshipType;
    reasonPrefix: string;
    minShared: number;
    maxConfidence: number;
    skipSameKrc?: boolean;
    maxBucketSize?: number;
  },
): void {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const tokenIndex = new Map<string, string[]>();
  const tokenSets = new Map<string, Set<string>>();

  for (const record of records) {
    const tokens = titleTokens(record);
    tokenSets.set(record.id, tokens);
    for (const token of tokens) {
      if (token.length < 4) continue;
      const list = tokenIndex.get(token) ?? [];
      list.push(record.id);
      tokenIndex.set(token, list);
    }
  }

  const pairShared = new Map<string, number>();
  const maxBucket = options.maxBucketSize ?? 20;

  for (const ids of tokenIndex.values()) {
    if (ids.length < 2 || ids.length > maxBucket) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
        pairShared.set(key, (pairShared.get(key) ?? 0) + 1);
      }
    }
  }

  for (const [key, sharedCount] of pairShared) {
    if (sharedCount < options.minShared) continue;
    const [idA, idB] = key.split('|');
    const a = recordById.get(idA);
    const b = recordById.get(idB);
    if (!a || !b) continue;
    if (options.skipSameKrc && a.repository.krcId === b.repository.krcId) continue;

    const shared = sharedTokenCount(tokenSets.get(idA) ?? new Set(), tokenSets.get(idB) ?? new Set());
    addRelationship(relationships, seen, {
      fromId: a.id,
      toId: b.id,
      relationshipType: options.relationshipType,
      reason: `${options.reasonPrefix}: ${shared.slice(0, 4).join(', ')}`,
      confidence: Math.min(options.maxConfidence, 35 + sharedCount * 10),
      supportingEvidenceIds: [a.id, b.id],
    });
  }
}
function extractCapabilities(record: EvidenceRecord): string[] {
  if (!record.session?.summaryReferences) return [];
  return record.session.summaryReferences
    .filter((ref) => ref.length > 2 && !ref.startsWith('Sources/'))
    .slice(0, 8);
}

/** Builds deterministic semantic relationships from the evidence index. */
export function buildRelationshipsFromEvidence(index: EvidenceIndex): KnowledgeRelationship[] {
  const relationships: KnowledgeRelationship[] = [];
  const seen = new Set<string>();
  const byKrc = recordsByKrc(index);

  const execSessionByKrc = new Map<string, EvidenceRecord>();
  for (const record of index.records) {
    if (record.kind === 'executive_session' && record.session?.linkedKrcId) {
      execSessionByKrc.set(record.session.linkedKrcId, record);
    }
  }

  for (const [krcId, records] of byKrc.entries()) {
    const conv = conversationRecord(records);
    const source = records.find((r) => r.kind === 'source');
    const attachments = records.filter((r) => r.kind === 'attachment');

    if (conv && source) {
      addRelationship(relationships, seen, {
        fromId: conv.id,
        toId: source.id,
        relationshipType: 'conversation_source',
        reason: `Shared KRC ${krcId}`,
        confidence: 98,
        supportingEvidenceIds: [conv.id, source.id],
      });
    }

    const execSession = execSessionByKrc.get(krcId);

    if (conv && execSession) {
      addRelationship(relationships, seen, {
        fromId: conv.id,
        toId: execSession.id,
        relationshipType: 'conversation_executive_session',
        reason: `Executive session linked to ${krcId}`,
        confidence: 95,
        supportingEvidenceIds: [conv.id, execSession.id],
      });
      if (source) {
        addRelationship(relationships, seen, {
          fromId: execSession.id,
          toId: source.id,
          relationshipType: 'executive_session_source',
          reason: `Transcript reference for ${krcId}`,
          confidence: 96,
          supportingEvidenceIds: [execSession.id, source.id],
        });
      }
    }

    for (const att of attachments) {
      if (conv) {
        addRelationship(relationships, seen, {
          fromId: att.id,
          toId: conv.id,
          relationshipType: 'attachment_conversation',
          reason: `Attachment linked to conversation ${krcId}`,
          confidence: att.attachment?.resolved ? 90 : 70,
          supportingEvidenceIds: [att.id, conv.id],
        });
        addRelationship(relationships, seen, {
          fromId: conv.id,
          toId: att.id,
          relationshipType: 'conversation_attachment',
          reason: `Conversation references attachment in ${krcId}`,
          confidence: att.attachment?.resolved ? 88 : 68,
          supportingEvidenceIds: [conv.id, att.id],
        });
      }
      if (source) {
        addRelationship(relationships, seen, {
          fromId: att.id,
          toId: source.id,
          relationshipType: 'attachment_source',
          reason: `Attachment referenced by source ${krcId}`,
          confidence: att.attachment?.resolved ? 92 : 72,
          supportingEvidenceIds: [att.id, source.id],
        });
      }
    }
  }

  const conversations: EvidenceRecord[] = [];
  for (const [, records] of byKrc.entries()) {
    const conv = conversationRecord(records);
    if (conv) conversations.push(conv);
  }

  pairRecordsBySharedTokens(conversations, relationships, seen, {
    relationshipType: 'conversation_conversation',
    reasonPrefix: 'Shared title concepts',
    minShared: 2,
    maxConfidence: 85,
    skipSameKrc: false,
  });

  const sessions = index.records.filter((r) => r.kind === 'executive_session');
  pairRecordsBySharedTokens(sessions, relationships, seen, {
    relationshipType: 'executive_session_executive_session',
    reasonPrefix: 'Shared session topics',
    minShared: 2,
    maxConfidence: 80,
    skipSameKrc: false,
  });

  const decisionRecords = index.records.filter((r) => {
    if (r.kind === 'executive_session') return true;
    const hay = `${r.excerpt} ${r.message?.text ?? ''}`.toLowerCase();
    return /\b(decision|decided|agreed|conclusion)\b/.test(hay);
  });

  pairRecordsBySharedTokens(decisionRecords, relationships, seen, {
    relationshipType: 'decision_decision',
    reasonPrefix: 'Shared decision language',
    minShared: 2,
    maxConfidence: 78,
    skipSameKrc: true,
    maxBucketSize: 25,
  });

  pairRecordsBySharedTokens(conversations, relationships, seen, {
    relationshipType: 'topic_topic',
    reasonPrefix: 'Shared topic',
    minShared: 1,
    maxConfidence: 65,
    skipSameKrc: false,
    maxBucketSize: 12,
  });

  const campaignMap = new Map<string, EvidenceRecord[]>();
  for (const record of index.records) {
    const hay = [record.excerpt, record.message?.text, record.conversation?.title]
      .filter(Boolean)
      .join(' ');
    for (const campaign of extractCampaigns(hay)) {
      const key = slug(campaign);
      const list = campaignMap.get(key) ?? [];
      list.push(record);
      campaignMap.set(key, list);
    }
  }

  for (const [campaignKey, members] of campaignMap.entries()) {
    const unique = [...new Map(members.map((m) => [m.id, m])).values()];
    if (unique.length < 2 || unique.length > 30) continue;
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        addRelationship(relationships, seen, {
          fromId: unique[i].id,
          toId: unique[j].id,
          relationshipType: 'campaign_campaign',
          reason: `Shared campaign reference (${campaignKey.replace(/-/g, ' ')})`,
          confidence: 82,
          supportingEvidenceIds: [unique[i].id, unique[j].id],
        });
      }
    }
  }

  const capabilityMap = new Map<string, EvidenceRecord[]>();
  for (const session of sessions) {
    for (const cap of extractCapabilities(session)) {
      const key = slug(cap);
      const list = capabilityMap.get(key) ?? [];
      list.push(session);
      capabilityMap.set(key, list);
    }
  }

  for (const [, caps] of capabilityMap.entries()) {
    if (caps.length < 2) continue;
    for (let i = 0; i < caps.length; i++) {
      for (let j = i + 1; j < caps.length; j++) {
        addRelationship(relationships, seen, {
          fromId: caps[i].id,
          toId: caps[j].id,
          relationshipType: 'capability_capability',
          reason: `Shared capability "${caps[i].conversation?.title ?? 'capability'}"`,
          confidence: 72,
          supportingEvidenceIds: [caps[i].id, caps[j].id],
        });
      }
    }
  }

  const attachments = index.records.filter((r) => r.kind === 'attachment');
  const attByFilename = new Map<string, EvidenceRecord[]>();
  for (const att of attachments) {
    const name = slug(att.attachment?.filename ?? att.excerpt);
    const list = attByFilename.get(name) ?? [];
    list.push(att);
    attByFilename.set(name, list);
  }

  for (const [, group] of attByFilename.entries()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].repository.krcId === group[j].repository.krcId) continue;
        addRelationship(relationships, seen, {
          fromId: group[i].id,
          toId: group[j].id,
          relationshipType: 'attachment_conversation',
          reason: `Shared attachment filename "${group[i].attachment?.filename ?? 'file'}"`,
          confidence: 74,
          supportingEvidenceIds: [group[i].id, group[j].id],
        });
      }
    }
  }

  return relationships;
}

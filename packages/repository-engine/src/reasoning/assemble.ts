import type {
  AssembledEvidenceContext,
  EvidenceDrilldown,
  EvidenceTimelineStep,
  RetrievedEvidenceItem,
  VigsyQuestionIntent,
} from '@scooper/core';
import { loadDrilldownsForItems, retrieveEvidenceForQuestion } from './retrieve.js';

function uniqueKrcIds(items: RetrievedEvidenceItem[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.krcId || seen.has(item.krcId)) continue;
    seen.add(item.krcId);
    ids.push(item.krcId);
  }
  return ids;
}

function mergeTimeline(drilldowns: EvidenceDrilldown[]): EvidenceTimelineStep[] {
  const steps: EvidenceTimelineStep[] = [];
  const seen = new Set<string>();

  for (const drilldown of drilldowns) {
    for (const step of drilldown.timeline) {
      const key = `${step.kind}:${step.explorerPath}:${step.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      steps.push(step);
    }
  }

  return steps.slice(0, 8);
}

function relatedFromDrilldowns(drilldowns: EvidenceDrilldown[]): RetrievedEvidenceItem[] {
  const items: RetrievedEvidenceItem[] = [];

  for (const drilldown of drilldowns) {
    for (const link of drilldown.sections.relatedSources.items) {
      items.push({
        recordId: link.recordId ?? link.explorerPath,
        kind: link.kind ?? 'source',
        score: 0,
        title: link.label,
        excerpt: link.subtitle ?? link.label,
        explorerPath: link.explorerPath,
        krcId: link.subtitle,
        matchReasons: ['related source'],
      });
    }
  }

  return items;
}

/** Assembles retrieved evidence into a reasoning context with drilldown chains. */
export function assembleEvidenceContext(
  index: import('@scooper/core').EvidenceIndex,
  question: string,
): AssembledEvidenceContext {
  const { intent, searchQuery, queryTerms, items } = retrieveEvidenceForQuestion(index, question);
  const drilldowns = loadDrilldownsForItems(index, items, searchQuery).filter(
    (item): item is EvidenceDrilldown => item !== null,
  );

  const executiveSessions = items.filter((item) => item.kind === 'executive_session');
  let attachments = items.filter((item) => item.kind === 'attachment');
  const messages = items.filter((item) => item.kind === 'message');

  if (intent === 'show_evidence' && attachments.length === 0) {
    for (const drilldown of drilldowns) {
      for (const link of drilldown.sections.attachments.items) {
        attachments.push({
          recordId: link.recordId ?? link.explorerPath,
          kind: 'attachment',
          score: 0,
          title: link.label,
          excerpt: link.subtitle ?? link.label,
          explorerPath: link.explorerPath,
          krcId: drilldown.anchorKrcId,
          matchReasons: ['drilldown attachment'],
        });
      }
    }
  }
  const relatedSources = relatedFromDrilldowns(drilldowns);

  return {
    question,
    intent,
    searchQuery,
    queryTerms,
    items,
    topKrcIds: uniqueKrcIds(items),
    executiveSessions,
    attachments,
    messages,
    relatedSources,
    timeline: mergeTimeline(drilldowns),
  };
}

export type { VigsyQuestionIntent };

import { randomUUID } from 'node:crypto';
import type {
  ExecutiveMemoryItem,
  ExecutiveSessionRecord,
  VigsyConversationRecord,
  VigsyConversationTurnRecord,
} from '@scooper/core';
import {
  classifyQuestionIntent,
  recordMatchesBlockerTerms,
  recordMatchesDecisionTerms,
} from '../reasoning/intent.js';

const CAMPAIGN_PATTERN =
  /campaign\s+([\d.]+[a-z]?)\s*(?:[—–-]\s*([^\n.?]+)|(?=\s|$))/gi;
const ACCOMPLISHMENT_PATTERN =
  /\b(completed?|finished|implemented|shipped|passed|pass\b|done with)\b/i;
const REPO_CHANGE_PATTERN =
  /\b(import(?:ed)?|repair(?:ed)?|index(?:ed)?|rebuilt|snapshot|rollback)\b/i;

function memoryItem(label: string, detail?: string, sourceTurnId?: string): ExecutiveMemoryItem {
  return {
    id: randomUUID(),
    label: label.trim(),
    detail: detail?.trim(),
    sourceTurnId,
    recordedAt: new Date().toISOString(),
  };
}

function mergeItems(existing: ExecutiveMemoryItem[], incoming: ExecutiveMemoryItem[]): ExecutiveMemoryItem[] {
  const seen = new Set(existing.map((item) => item.label.toLowerCase()));
  const merged = [...existing];
  for (const item of incoming) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(-24);
}

function extractCampaign(text: string): string | undefined {
  const matches = [...text.matchAll(CAMPAIGN_PATTERN)];
  if (matches.length === 0) return undefined;
  const last = matches[matches.length - 1];
  const id = last[1]?.trim();
  const name = last[2]?.trim();
  if (!id) return undefined;
  return name ? `Campaign ${id} — ${name}` : `Campaign ${id}`;
}

function turnText(turn: VigsyConversationTurnRecord): string {
  return [turn.question, turn.displayText, turn.supportingText, turn.answer?.directAnswer, turn.answer?.reasonedSummary]
    .filter(Boolean)
    .join('\n');
}

function extractFromTurn(
  turn: VigsyConversationTurnRecord,
  session: ExecutiveSessionRecord,
): Partial<ExecutiveSessionRecord> {
  const text = turnText(turn);
  const updates: Partial<ExecutiveSessionRecord> = {};

  const campaign = extractCampaign(text);
  if (campaign) updates.currentCampaign = campaign;

  if (turn.role === 'user' && turn.question && !session.currentObjective) {
    updates.currentObjective = turn.question.trim();
  }

  if (turn.role === 'assistant' && turn.answer) {
    const answerText = [turn.answer.directAnswer, turn.answer.reasonedSummary].join(' ');
    const intent = turn.question ? classifyQuestionIntent(turn.question) : 'general';

    if (intent === 'decision' || recordMatchesDecisionTerms(answerText)) {
      updates.currentDecisions = mergeItems(session.currentDecisions, [
        memoryItem(turn.answer.directAnswer.slice(0, 160), turn.question, turn.turnId),
      ]);
    }

    if (intent === 'blockers' || recordMatchesBlockerTerms(answerText)) {
      updates.currentBlockers = mergeItems(session.currentBlockers, [
        memoryItem(turn.answer.directAnswer.slice(0, 160), turn.question, turn.turnId),
      ]);
    }

    if (ACCOMPLISHMENT_PATTERN.test(answerText) || ACCOMPLISHMENT_PATTERN.test(turn.displayText)) {
      updates.currentAccomplishments = mergeItems(session.currentAccomplishments, [
        memoryItem(turn.answer.directAnswer.slice(0, 160), turn.question, turn.turnId),
      ]);
    }

    const evidenceItems = turn.answer.evidenceUsed.map((item) =>
      memoryItem(item.label, item.recordId, turn.turnId),
    );
    updates.currentEvidence = mergeItems(session.currentEvidence, evidenceItems);

    const fileItems = [
      ...turn.answer.explorerLinks.map((link) =>
        memoryItem(link.label, link.path, turn.turnId),
      ),
      ...turn.answer.attachments.map((item) => memoryItem(item.label, item.explorerPath, turn.turnId)),
    ];
    updates.currentFiles = mergeItems(session.currentFiles, fileItems);

    if (turn.followUpContext) updates.followUpContext = turn.followUpContext;
  }

  if (REPO_CHANGE_PATTERN.test(text)) {
    const label = turn.question?.trim() || text.slice(0, 120);
    updates.currentRepositoryChanges = mergeItems(session.currentRepositoryChanges, [
      memoryItem(label, undefined, turn.turnId),
    ]);
  }

  return updates;
}

function deriveUnfinishedWork(session: ExecutiveSessionRecord): string[] {
  const items: string[] = [];
  for (const blocker of session.currentBlockers) {
    items.push(blocker.label);
  }
  if (session.currentBlockers.length === 0) {
    for (const line of session.unfinishedWork) {
      if (/unfinished|remaining|blocker|not yet|todo/i.test(line)) items.push(line);
    }
  }
  return [...new Set(items)].slice(0, 6);
}

function deriveRecommendedNextAction(session: ExecutiveSessionRecord): string | undefined {
  if (session.currentBlockers.length > 0) {
    return `continue working on ${session.currentBlockers[session.currentBlockers.length - 1].label}`;
  }
  if (session.currentObjective) {
    return `continue with ${session.currentObjective}`;
  }
  if (session.followUpContext?.lastSearchQuery) {
    return `pick up where we left off on ${session.followUpContext.lastSearchQuery}`;
  }
  return 'continue where we left off';
}

/** Extracts executive memory fields from a persisted Vigsy conversation. */
export function extractExecutiveMemory(
  record: VigsyConversationRecord,
  session: ExecutiveSessionRecord,
): ExecutiveSessionRecord {
  let next: ExecutiveSessionRecord = {
    ...session,
    title: record.title || session.title,
    updatedAt: new Date().toISOString(),
  };

  for (const turn of record.turns) {
    const updates = extractFromTurn(turn, next);
    next = { ...next, ...updates };
  }

  const lastAssistant = [...record.turns].reverse().find((turn) => turn.role === 'assistant');
  if (lastAssistant?.followUpContext) {
    next.followUpContext = lastAssistant.followUpContext;
  }

  next.unfinishedWork = deriveUnfinishedWork(next);
  next.recommendedNextAction = deriveRecommendedNextAction(next);
  return next;
}

import type {
  AnswerKnowledgeOptions,
  AssembledEvidenceContext,
  ConversationContext,
  ExecutiveBriefing,
  ExecutiveSessionRecord,
  ReasoningContext,
} from '@scooper/core';

export interface BuildReasoningContextInput {
  repositoryPath: string;
  question: string;
  evidence: AssembledEvidenceContext;
  conversation?: ConversationContext;
  executiveMemory?: ExecutiveSessionRecord | null;
  executiveBriefing?: ExecutiveBriefing | null;
}

/** Builds curated provider context — KAE-owned, no repository file access for AI.
 * Includes conversation turns, executive memory, and briefing for live prompt assembly.
 */
export function buildReasoningContext(input: BuildReasoningContextInput): ReasoningContext {
  const memory = input.executiveMemory ?? null;
  const conversation = input.conversation ?? { turns: [] };

  return {
    question: input.question,
    repositoryPath: input.repositoryPath,
    conversation: {
      conversationId: conversation.conversationId,
      turns: conversation.turns ?? [],
      followUpContext: conversation.followUpContext,
    },
    executiveMemory: memory,
    evidence: input.evidence,
    executiveBriefing: input.executiveBriefing ?? null,
    campaign: memory?.currentCampaign,
    objective: memory?.currentObjective,
    blockers: [
      ...(memory?.currentBlockers.map((item) => item.label) ?? []),
      ...(memory?.unfinishedWork ?? []),
    ],
    accomplishments: memory?.currentAccomplishments.map((item) => item.label) ?? [],
    repositorySummary: input.executiveBriefing
      ? `${input.executiveBriefing.evidenceRecordCount} evidence records; ${input.executiveBriefing.relationshipCount} relationships`
      : undefined,
  };
}

export function conversationContextFromOptions(
  options?: AnswerKnowledgeOptions,
): ConversationContext | undefined {
  return options?.conversationContext;
}

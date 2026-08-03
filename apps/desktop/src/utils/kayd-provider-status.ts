import type { VigsyConversationTurn } from '../hooks/useVigsyConversation';

/** Honest live / offline / thinking label for KayD presence (shared by flow + dock). */
export function kaydReasoningStatusLabel(
  turn: Pick<VigsyConversationTurn, 'thinking' | 'answer' | 'error'> | null | undefined,
  fallback = 'With you on this',
): string {
  if (!turn) return fallback;
  if (turn.thinking) return 'Thinking through your repository…';
  const answer = turn.answer;
  if (!answer && turn.error) return fallback;
  if (!answer) return fallback;
  if (answer.usedOfflineFallback) {
    if (
      answer.reasoningProviderId &&
      answer.reasoningProviderId !== 'mock' &&
      answer.reasoningProviderId !== 'deterministic'
    ) {
      return 'Offline fallback';
    }
    return 'Offline grounded';
  }
  if (answer.reasoningProviderId === 'openai') return 'Live OpenAI';
  if (answer.reasoningProviderId === 'mock' || answer.reasoningProviderId === 'deterministic') {
    return 'Offline grounded';
  }
  return fallback;
}

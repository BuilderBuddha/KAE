import { useCallback, useRef, useState } from 'react';
import type { VigsyKnowledgeAnswer } from '@scooper/core';
import { enrichFollowUpQuestion, sessionFromAnswer, type VigsySessionContext } from '../utils/vigsy-context';
import { presenceDelayMs, streamTextReveal } from '../utils/vigsy-stream';

export interface VigsyConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  summary?: string;
  answer?: VigsyKnowledgeAnswer;
  thinking?: boolean;
  streaming?: boolean;
  error?: string;
}

let turnCounter = 0;
function nextId(): string {
  turnCounter += 1;
  return `turn-${turnCounter}`;
}

export function useVigsyConversation() {
  const [turns, setTurns] = useState<VigsyConversationTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<VigsySessionContext>({});
  const abortRef = useRef(false);

  const submitQuestion = useCallback(async (rawQuestion: string) => {
    const question = enrichFollowUpQuestion(rawQuestion, sessionRef.current);
    if (!question.trim() || busy) return;

    abortRef.current = false;
    setBusy(true);

    const userTurn: VigsyConversationTurn = { id: nextId(), role: 'user', text: question };
    const assistantId = nextId();
    const assistantTurn: VigsyConversationTurn = {
      id: assistantId,
      role: 'assistant',
      text: '',
      thinking: true,
    };

    setTurns((prev) => [...prev, userTurn, assistantTurn]);

    try {
      const answer = await window.kae.answerKnowledgeQuestion(question);
      if (abortRef.current) return;

      sessionRef.current = sessionFromAnswer(question, answer);
      const answerText = answer.directAnswer;
      const summaryText = answer.reasonedSummary;

      await new Promise((resolve) => window.setTimeout(resolve, presenceDelayMs()));

      if (abortRef.current) return;

      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === assistantId
            ? { ...turn, thinking: false, streaming: true, answer, text: '', summary: summaryText }
            : turn,
        ),
      );

      await streamTextReveal(answerText, (visible) => {
        if (abortRef.current) return;
        setTurns((prev) =>
          prev.map((turn) => (turn.id === assistantId ? { ...turn, text: visible } : turn)),
        );
      });

      if (abortRef.current) return;

      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === assistantId
            ? { ...turn, streaming: false, text: answerText, summary: summaryText, answer }
            : turn,
        ),
      );
    } catch {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === assistantId
            ? {
                ...turn,
                thinking: false,
                streaming: false,
                error: 'Unable to answer from indexed evidence.',
                text: 'I could not ground an answer in the repository evidence index.',
              }
            : turn,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const clearConversation = useCallback(() => {
    abortRef.current = true;
    sessionRef.current = {};
    setTurns([]);
    setBusy(false);
  }, []);

  const hasConversation = turns.length > 0;

  return {
    turns,
    busy,
    hasConversation,
    submitQuestion,
    clearConversation,
    session: sessionRef.current,
  };
}

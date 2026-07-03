import { useCallback, useEffect, useRef, useState } from 'react';
import type { VigsyConversationRecord, VigsyConversationTurnRecord, VigsyKnowledgeAnswer, ExecutiveContinuity } from '@scooper/core';
import {
  enrichFollowUpQuestion,
  sessionFromAnswer,
  type VigsySessionContext,
} from '../utils/vigsy-context';
import { formatConversationalAnswer } from '../utils/vigsy-answer-format';
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

function followUpFromSession(session: VigsySessionContext) {
  return {
    lastQuestion: session.lastQuestion,
    lastSearchQuery: session.lastSearchQuery,
    lastKrcIds: session.lastKrcIds,
  };
}

function toUiTurn(record: VigsyConversationTurnRecord): VigsyConversationTurn {
  return {
    id: record.turnId,
    role: record.role,
    text: record.displayText,
    summary: record.supportingText,
    answer: record.answer,
    error: record.error,
  };
}

function toPersistedTurns(turns: VigsyConversationTurn[], session: VigsySessionContext): VigsyConversationTurnRecord[] {
  const records: VigsyConversationTurnRecord[] = [];
  for (const turn of turns) {
    if (turn.thinking || turn.streaming) continue;
    records.push({
      turnId: turn.id,
      role: turn.role,
      createdAt: new Date().toISOString(),
      question: turn.role === 'user' ? turn.text : undefined,
      displayText: turn.text,
      supportingText: turn.summary,
      answer: turn.answer,
      evidenceIds: turn.answer?.evidenceUsed.map((item) => item.recordId),
      confidence: turn.answer?.confidence,
      followUpContext: turn.role === 'assistant' ? followUpFromSession(session) : undefined,
      error: turn.error,
    });
  }
  return records;
}

export function useVigsyConversation() {
  const [turns, setTurns] = useState<VigsyConversationTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const recordRef = useRef<VigsyConversationRecord | null>(null);
  const sessionRef = useRef<VigsySessionContext>({});
  const abortRef = useRef(false);
  const [continuity, setContinuity] = useState<ExecutiveContinuity | null>(null);

  const refreshContinuity = useCallback(async () => {
    const next = await window.kae.getExecutiveContinuity();
    setContinuity(next);
  }, []);

  const persistConversation = useCallback(async (nextTurns: VigsyConversationTurn[]) => {
    if (!recordRef.current) return;
    const persistedTurns = toPersistedTurns(nextTurns, sessionRef.current);
    const record = {
      ...recordRef.current,
      updatedAt: new Date().toISOString(),
      turns: persistedTurns,
      title:
        recordRef.current.title === 'Vigsy conversation' && persistedTurns[0]?.question
          ? persistedTurns[0].question.slice(0, 72)
          : recordRef.current.title,
    };
    recordRef.current = record;
    await window.kae.saveVigsyConversation(record);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const record = await window.kae.loadActiveVigsyConversation();
        if (cancelled) return;
        if (record && record.turns.length > 0) {
          recordRef.current = record;
          setConversationId(record.conversationId);
          setTurns(record.turns.map(toUiTurn));
          const lastAssistant = [...record.turns].reverse().find((turn) => turn.role === 'assistant');
          if (lastAssistant?.followUpContext) {
            sessionRef.current = lastAssistant.followUpContext;
          }
        } else if (record) {
          recordRef.current = record;
          setConversationId(record.conversationId);
        } else {
          const created = await window.kae.createVigsyConversation();
          if (!cancelled) {
            recordRef.current = created;
            setConversationId(created.conversationId);
          }
        }
        if (!cancelled) await refreshContinuity();
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshContinuity]);

  useEffect(() => {
    const offMemory = window.kae.onExecutiveMemoryUpdated(() => {
      void refreshContinuity();
    });
    const offVigsy = window.kae.onVigsyRefreshed(() => {
      void refreshContinuity();
    });
    return () => {
      offMemory();
      offVigsy();
    };
  }, [refreshContinuity]);

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

    const nextTurns = [...turns, userTurn, assistantTurn];
    setTurns(nextTurns);

    try {
      const settings = await window.kae.getSettings();
      const conversationContext = {
        conversationId: conversationId ?? recordRef.current?.conversationId,
        turns: turns.map((turn) => ({ role: turn.role, text: turn.text })),
        followUpContext: sessionRef.current,
      };

      let answer: VigsyKnowledgeAnswer;
      let streamText = '';
      let supportingText = '';

      if (settings.aiStreaming) {
        let visibleDirect = '';
        const offStream = window.kae.onReasoningStreamChunk((chunk) => {
          if (abortRef.current) return;
          if (chunk.kind === 'token') {
            visibleDirect += chunk.text;
            setTurns((prev) =>
              prev.map((turn) =>
                turn.id === assistantId
                  ? { ...turn, thinking: false, streaming: true, text: visibleDirect }
                  : turn,
              ),
            );
          }
          if (chunk.kind === 'direct_answer') visibleDirect = chunk.text;
          if (chunk.kind === 'summary') supportingText = chunk.text;
        });
        try {
          answer = await window.kae.answerKnowledgeQuestionStream(question, { conversationContext });
        } finally {
          offStream();
        }
        if (abortRef.current) return;
        const formatted = formatConversationalAnswer(answer);
        streamText = formatted.streamText;
        supportingText = formatted.supportingText;
      } else {
        answer = await window.kae.answerKnowledgeQuestion(question, { conversationContext });
        if (abortRef.current) return;
        const formatted = formatConversationalAnswer(answer);
        streamText = formatted.streamText;
        supportingText = formatted.supportingText;

        await new Promise((resolve) => window.setTimeout(resolve, presenceDelayMs()));
        if (abortRef.current) return;

        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === assistantId
              ? { ...turn, thinking: false, streaming: true, answer, text: '', summary: supportingText }
              : turn,
          ),
        );

        await streamTextReveal(streamText, (visible) => {
          if (abortRef.current) return;
          setTurns((prev) =>
            prev.map((turn) => (turn.id === assistantId ? { ...turn, text: visible } : turn)),
          );
        });
      }

      if (abortRef.current) return;

      sessionRef.current = sessionFromAnswer(question, answer);

      const completedTurns = nextTurns.map((turn) =>
        turn.id === assistantId
          ? {
              ...turn,
              thinking: false,
              streaming: false,
              text: streamText,
              summary: supportingText,
              answer,
            }
          : turn,
      );
      setTurns(completedTurns);
      await persistConversation(completedTurns);
      await refreshContinuity();
    } catch {
      const failedTurns = nextTurns.map((turn) =>
        turn.id === assistantId
          ? {
              ...turn,
              thinking: false,
              streaming: false,
              error: 'Unable to answer from indexed evidence.',
              text: "I couldn't ground an answer in the repository evidence index.",
            }
          : turn,
      );
      setTurns(failedTurns);
      await persistConversation(failedTurns);
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, persistConversation, refreshContinuity, turns]);

  const startNewConversation = useCallback(async () => {
    abortRef.current = true;
    sessionRef.current = {};
    setBusy(false);
    const created = await window.kae.createVigsyConversation();
    recordRef.current = created;
    setConversationId(created.conversationId);
    setTurns([]);
    await refreshContinuity();
    abortRef.current = false;
  }, [refreshContinuity]);

  const clearConversation = useCallback(async () => {
    abortRef.current = true;
    const id = conversationId ?? recordRef.current?.conversationId;
    if (id) {
      await window.kae.deleteVigsyConversation(id);
    }
    sessionRef.current = {};
    setBusy(false);
    const created = await window.kae.createVigsyConversation();
    recordRef.current = created;
    setConversationId(created.conversationId);
    setTurns([]);
    await refreshContinuity();
    abortRef.current = false;
  }, [conversationId, refreshContinuity]);

  const hasConversation = turns.length > 0;

  return {
    turns,
    busy,
    ready,
    conversationId,
    hasConversation,
    submitQuestion,
    startNewConversation,
    clearConversation,
    continuity,
    refreshContinuity,
    session: sessionRef.current,
  };
}

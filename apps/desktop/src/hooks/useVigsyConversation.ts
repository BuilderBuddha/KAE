import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VigsyConversationRecord, VigsyConversationTurnRecord, VigsyKnowledgeAnswer, ExecutiveContinuity } from '@scooper/core';
import {
  resolveFollowUp,
  sessionFromAnswer,
  type VigsySessionContext,
} from '../utils/vigsy-context';
import { formatConversationalAnswer } from '../utils/vigsy-answer-format';
import {
  initialThinkingPresentation,
  presentationAfterTransportToken,
  presentationComplete,
  presentationReadyToReveal,
  presentationRevealChunk,
} from '../utils/kayd-answer-presentation';
import { presenceDelayMs, streamTextReveal } from '../utils/vigsy-stream';
import {
  investigationFromSession,
  investigationViewLabel,
  isNewInvestigationQuestion,
  investigationViewQuestion,
  type ActiveInvestigation,
  type InvestigationView,
} from '../utils/investigation-workflow';
import { investigationScreenForView } from '../utils/investigation-capability';
import type { ScreenId } from '../types/navigation';

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

export interface SubmitQuestionOptions {
  /** True only when the question comes from an explicit capability chip / continue-view. */
  capabilityOrigin?: boolean;
}

const CONTEXT_TURN_WINDOW = 4;

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

function completedContextTurns(
  priorTurns: VigsyConversationTurn[],
  currentRawQuestion: string,
): Array<{ role: 'user' | 'assistant'; text: string }> {
  const completed = priorTurns
    .filter((turn) => !turn.thinking && !turn.streaming && turn.text.trim())
    .map((turn) => ({ role: turn.role, text: turn.text }));

  const withoutDupCurrent =
    completed.length > 0 &&
    completed[completed.length - 1]?.role === 'user' &&
    completed[completed.length - 1]?.text === currentRawQuestion
      ? completed
      : [...completed, { role: 'user' as const, text: currentRawQuestion }];

  return withoutDupCurrent.slice(-CONTEXT_TURN_WINDOW);
}

export function useVigsyConversationState(navigate?: (screen: ScreenId) => void) {
  const [turns, setTurns] = useState<VigsyConversationTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const recordRef = useRef<VigsyConversationRecord | null>(null);
  const sessionRef = useRef<VigsySessionContext>({});
  const abortRef = useRef(false);
  const [continuity, setContinuity] = useState<ExecutiveContinuity | null>(null);
  const [activeInvestigation, setActiveInvestigation] = useState<ActiveInvestigation | null>(null);
  const [investigationEpoch, setInvestigationEpoch] = useState(0);
  const [investigationLens, setInvestigationLens] = useState<string | null>(null);
  const [sealedOpenerLines, setSealedOpenerLines] = useState<string[]>([]);

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
        (recordRef.current.title === 'Vigsy conversation' ||
          recordRef.current.title === 'KayD conversation') &&
        persistedTurns[0]?.question
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
        // Fresh session on every app open — KayD home welcome sequence, not restored history.
        const created = await window.kae.createVigsyConversation();
        if (cancelled) return;
        recordRef.current = created;
        setConversationId(created.conversationId);
        setTurns([]);
        sessionRef.current = {};
        setActiveInvestigation(null);
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

  const submitQuestion = useCallback(
    async (rawInput: string, options?: SubmitQuestionOptions) => {
      const capabilityOrigin = Boolean(options?.capabilityOrigin);
      const resolved = resolveFollowUp(rawInput, sessionRef.current, { capabilityOrigin });
      const rawQuestion = resolved.rawQuestion;
      if (!rawQuestion || busy) return;

      const startingNewInvestigation = isNewInvestigationQuestion(rawQuestion, sessionRef.current);
      if (startingNewInvestigation) {
        navigate?.('vigsy');
        setInvestigationEpoch((epoch) => epoch + 1);
        setInvestigationLens(null);
      } else if (capabilityOrigin) {
        const lens = investigationViewLabel(resolved.retrievalQuestion);
        if (lens) setInvestigationLens(lens);
      }

      abortRef.current = false;
      setBusy(true);

      // Display/store the raw executive question — never the internal enrichment.
      const userTurn: VigsyConversationTurn = { id: nextId(), role: 'user', text: rawQuestion };
      const assistantId = nextId();
      const thinkingPresentation = initialThinkingPresentation();
      const assistantTurn: VigsyConversationTurn = {
        id: assistantId,
        role: 'assistant',
        text: thinkingPresentation.text,
        thinking: thinkingPresentation.thinking,
        streaming: thinkingPresentation.streaming,
      };

      const priorTurns = turns;
      const nextTurns = [...priorTurns, userTurn, assistantTurn];
      setTurns(nextTurns);

      const stableTopic = resolved.stableTopic || sessionRef.current.lastSearchQuery;
      const conversationContext = {
        conversationId: conversationId ?? recordRef.current?.conversationId,
        turns: completedContextTurns(priorTurns, rawQuestion),
        followUpContext: {
          ...sessionRef.current,
          lastSearchQuery: stableTopic || sessionRef.current.lastSearchQuery,
          lastQuestion: rawQuestion,
        },
      };

      try {
        const settings = await window.kae.getSettings();
        let answer: VigsyKnowledgeAnswer;
        let streamText = '';
        let supportingText = '';

        if (settings.aiStreaming) {
          // Transport chunks are ignored for visible prose — accumulate nothing into turn.text.
          const offStream = window.kae.onReasoningStreamChunk((chunk) => {
            if (abortRef.current) return;
            if (chunk.kind === 'token') {
              // Keep thinking presentation; never paint raw IPC tokens into turn.text.
              presentationAfterTransportToken(thinkingPresentation, chunk.text);
            }
          });
          try {
            answer = await window.kae.answerKnowledgeQuestionStream(resolved.retrievalQuestion, {
              conversationContext,
            });
          } finally {
            offStream();
          }
          if (abortRef.current) return;
        } else {
          answer = await window.kae.answerKnowledgeQuestion(resolved.retrievalQuestion, {
            conversationContext,
          });
          if (abortRef.current) return;
        }

        const formatted = formatConversationalAnswer(
          answer,
          resolved.retrievalQuestion,
          stableTopic,
          {
            rawQuestion,
            stableTopic,
            capabilityOrigin,
          },
        );
        streamText = formatted.streamText;
        supportingText = formatted.supportingText;

        // Thinking/presence stays until verify + format complete, then one reveal.
        await new Promise((resolve) => window.setTimeout(resolve, presenceDelayMs()));
        if (abortRef.current) return;

        const ready = presentationReadyToReveal();
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === assistantId
              ? {
                  ...turn,
                  thinking: ready.thinking,
                  streaming: ready.streaming,
                  answer,
                  text: ready.text,
                  summary: supportingText,
                }
              : turn,
          ),
        );

        await streamTextReveal(streamText, (visible) => {
          if (abortRef.current) return;
          const chunk = presentationRevealChunk(visible);
          setTurns((prev) =>
            prev.map((turn) =>
              turn.id === assistantId
                ? { ...turn, thinking: chunk.thinking, streaming: chunk.streaming, text: chunk.text }
                : turn,
            ),
          );
        });

        if (abortRef.current) return;

        sessionRef.current = sessionFromAnswer(rawQuestion, answer, sessionRef.current);
        setActiveInvestigation(investigationFromSession(sessionRef.current));

        const settled = presentationComplete(streamText);
        const completedTurns = nextTurns.map((turn) =>
          turn.id === assistantId
            ? {
                ...turn,
                thinking: settled.thinking,
                streaming: settled.streaming,
                text: settled.text,
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
    },
    [busy, conversationId, navigate, persistConversation, refreshContinuity, turns],
  );

  const sealHomeOpener = useCallback((lines: string[]) => {
    const trimmed = lines.map((line) => line.trim()).filter(Boolean);
    if (trimmed.length > 0) setSealedOpenerLines(trimmed);
  }, []);

  const startNewConversation = useCallback(async () => {
    abortRef.current = true;
    sessionRef.current = {};
    setActiveInvestigation(null);
    setInvestigationLens(null);
    setSealedOpenerLines([]);
    setInvestigationEpoch((epoch) => epoch + 1);
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
    setActiveInvestigation(null);
    setInvestigationLens(null);
    setSealedOpenerLines([]);
    setInvestigationEpoch((epoch) => epoch + 1);
    setBusy(false);
    const created = await window.kae.createVigsyConversation();
    recordRef.current = created;
    setConversationId(created.conversationId);
    setTurns([]);
    await refreshContinuity();
    abortRef.current = false;
  }, [conversationId, refreshContinuity]);

  const hasConversation = turns.length > 0;
  const investigationSearchQuery =
    activeInvestigation?.searchQuery ??
    sessionRef.current.lastSearchQuery ??
    '';
  const investigationActive = Boolean(investigationSearchQuery);

  const continueInvestigationView = useCallback(
    (view: InvestigationView) => {
      const searchQuery = sessionRef.current.lastSearchQuery || investigationSearchQuery;
      if (!searchQuery || busy) return;
      const screen = investigationScreenForView(view);
      if (screen && screen !== 'vigsy') navigate?.(screen);
      void submitQuestion(investigationViewQuestion(view, searchQuery), { capabilityOrigin: true });
    },
    [busy, investigationSearchQuery, navigate, submitQuestion],
  );

  const latestInvestigationAnswer = useMemo(() => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index];
      if (turn.role === 'assistant' && !turn.thinking && turn.answer) return turn.answer;
    }
    return null;
  }, [turns]);

  return {
    turns,
    busy,
    ready,
    conversationId,
    hasConversation,
    investigationActive,
    activeInvestigation,
    investigationLens,
    investigationEpoch,
    latestInvestigationAnswer,
    sealedOpenerLines,
    submitQuestion,
    continueInvestigationView,
    sealHomeOpener,
    startNewConversation,
    clearConversation,
    continuity,
    refreshContinuity,
    session: sessionRef.current,
  };
}

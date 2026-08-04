import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ExecutiveBriefTask,
  VigsyConversationRecord,
  VigsyConversationTurnRecord,
  VigsyKnowledgeAnswer,
  ExecutiveContinuity,
} from '@scooper/core';
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
import {
  EXECUTIVE_BRIEF_ALREADY_READY_MESSAGE,
  executiveBriefNeedsEvidenceText,
  executiveBriefTransitionMessage,
  shouldUseExecutiveBriefTaskResponse,
} from '../utils/kayd-executive-brief-presentation';
import { resolveExecutiveBriefSourceAnswer } from '../utils/kayd-executive-brief-evidence';
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

function latestAnswerFromTurns(turns: VigsyConversationTurn[]): VigsyKnowledgeAnswer | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn.role === 'assistant' && !turn.thinking && turn.answer) return turn.answer;
  }
  return null;
}

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
  /** Shared composer draft — survives screen remounts; never filled from searchQuery. */
  const [composerDraft, setComposerDraft] = useState('');
  /** Explorer selection that survives navigation within an investigation. */
  const [selectedEvidencePath, setSelectedEvidencePath] = useState<string | null>(null);
  /** Active governed Executive Brief task (preview → approve → write). */
  const [executiveBriefTask, setExecutiveBriefTask] = useState<ExecutiveBriefTask | null>(null);
  const executiveBriefTaskRef = useRef<ExecutiveBriefTask | null>(null);
  executiveBriefTaskRef.current = executiveBriefTask;

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
        setSelectedEvidencePath(null);
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

        const rawBrief = executiveBriefTaskRef.current;
        // Cancelled/saved tasks are terminal — never treat them as the active preview.
        const activeBrief =
          rawBrief &&
          (rawBrief.state === 'preview-ready' || rawBrief.state === 'revision-requested')
            ? rawBrief
            : null;
        const revising = activeBrief?.state === 'revision-requested';
        const questionIsBriefRequest = await window.kae.isExecutiveBriefRequest(rawQuestion);
        const reviseRequested =
          /\brevise\b/i.test(rawQuestion) &&
          /\bexecutive\s+brief(?:ing)?\b/i.test(rawQuestion) &&
          !/\b(prepare|create|make|write|give|turn)\b/i.test(rawQuestion);
        const reviseWithActivePreview = Boolean(reviseRequested && activeBrief);

        const investigationAnswer = latestAnswerFromTurns(priorTurns);

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

        const briefTaskResponse = shouldUseExecutiveBriefTaskResponse({
          revising,
          intent: answer.intent,
          questionIsBriefRequest,
          reviseWithActivePreview,
        });

        // Preview already active — do not create a parallel task or replace the preview.
        const alreadyReadyBrief =
          Boolean(briefTaskResponse) &&
          !revising &&
          activeBrief?.state === 'preview-ready' &&
          (questionIsBriefRequest || answer.intent === 'executive_brief');

        // Brief request without governed evidence — honest guidance, not an ordinary answer.
        if (briefTaskResponse && !revising && !alreadyReadyBrief) {
          const source = resolveExecutiveBriefSourceAnswer({
            briefAnswer: answer,
            investigationAnswer,
            selectedEvidencePath,
          });
          if (!source.ok) {
            const needsEvidenceText = executiveBriefNeedsEvidenceText();
            const settledNeeds = presentationComplete(needsEvidenceText);
            const needsTurns = nextTurns.map((turn) =>
              turn.id === assistantId
                ? {
                    ...turn,
                    thinking: settledNeeds.thinking,
                    streaming: settledNeeds.streaming,
                    text: settledNeeds.text,
                    summary: undefined,
                    answer: undefined,
                    error: undefined,
                  }
                : turn,
            );
            setTurns(needsTurns);
            await persistConversation(needsTurns);
            await refreshContinuity();
            return;
          }
        }

        if (alreadyReadyBrief) {
          streamText = EXECUTIVE_BRIEF_ALREADY_READY_MESSAGE;
          supportingText = '';
        } else if (briefTaskResponse) {
          // One task response: concise transition only — preview carries the brief content.
          streamText = executiveBriefTransitionMessage(revising ? 'revise' : 'prepare');
          supportingText = '';
        } else {
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
        }

        const taskTurnOnly = briefTaskResponse || alreadyReadyBrief;

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
                  answer: taskTurnOnly ? undefined : answer,
                  text: ready.text,
                  summary: supportingText || undefined,
                  error: undefined,
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
                ? {
                    ...turn,
                    thinking: chunk.thinking,
                    streaming: chunk.streaming,
                    text: chunk.text,
                    error: undefined,
                  }
                : turn,
            ),
          );
        });

        if (abortRef.current) return;

        sessionRef.current = sessionFromAnswer(rawQuestion, answer, sessionRef.current);
        setActiveInvestigation(investigationFromSession(sessionRef.current));

        // Governed Executive Brief: prepare or revise preview without writing.
        // Already-ready: keep existing preview — no parallel prepare.
        if (briefTaskResponse && !alreadyReadyBrief) {
          try {
            if (revising && activeBrief) {
              const revised = await window.kae.reviseExecutiveBrief({
                taskId: activeBrief.taskId,
                answer,
              });
              setExecutiveBriefTask(revised);
            } else {
              const source = resolveExecutiveBriefSourceAnswer({
                briefAnswer: answer,
                investigationAnswer,
                selectedEvidencePath,
              });
              if (!source.ok) {
                // Guarded above; keep honest failure if race clears evidence.
                throw new Error('no-evidence');
              }
              const conversationKey =
                conversationId ?? recordRef.current?.conversationId ?? 'unknown-conversation';
              const topic =
                sessionRef.current.lastSearchQuery ||
                source.answer.searchQuery ||
                rawQuestion;
              const prepared = await window.kae.prepareExecutiveBrief({
                conversationId: conversationKey,
                topic,
                answer: source.answer,
              });
              setExecutiveBriefTask(prepared);
            }
          } catch {
            // Genuine prepare/revise failure — no successful preview; one honest message.
            // Do not clear an existing active preview on a failed parallel attempt.
            if (!revising && !activeBrief) setExecutiveBriefTask(null);
            const failedBriefTurns = nextTurns.map((turn) =>
              turn.id === assistantId
                ? {
                    ...turn,
                    thinking: false,
                    streaming: false,
                    answer: undefined,
                    summary: undefined,
                    error: 'Unable to prepare the Executive Brief from indexed evidence.',
                    text: 'I could not prepare the Executive Brief from the repository evidence index.',
                  }
                : turn,
            );
            setTurns(failedBriefTurns);
            await persistConversation(failedBriefTurns);
            return;
          }
        }

        const settled = presentationComplete(streamText);
        const completedTurns = nextTurns.map((turn) =>
          turn.id === assistantId
            ? {
                ...turn,
                thinking: settled.thinking,
                streaming: settled.streaming,
                text: settled.text,
                summary: supportingText || undefined,
                // Brief turns keep transition text only; ordinary turns keep the grounded answer.
                answer: taskTurnOnly ? undefined : answer,
                error: undefined,
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
    [busy, conversationId, navigate, persistConversation, refreshContinuity, selectedEvidencePath, turns],
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
    setComposerDraft('');
    setSelectedEvidencePath(null);
    setExecutiveBriefTask(null);
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
    setComposerDraft('');
    setSelectedEvidencePath(null);
    setExecutiveBriefTask(null);
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

  const approveExecutiveBrief = useCallback(async () => {
    const task = executiveBriefTaskRef.current;
    if (!task || busy) return;
    setBusy(true);
    try {
      const next = await window.kae.approveExecutiveBrief({
        taskId: task.taskId,
        approvalToken: task.taskId,
      });
      setExecutiveBriefTask(next);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const cancelExecutiveBrief = useCallback(async () => {
    const task = executiveBriefTaskRef.current;
    if (!task || busy) return;
    if (task.state === 'cancelled' || task.state === 'saved-and-registered') return;
    setBusy(true);
    try {
      await window.kae.cancelExecutiveBrief(task.taskId);
      // Keep cancelled terminal in main; clear renderer so a later request can prepare a new task.
      setExecutiveBriefTask(null);
      setComposerDraft((draft) =>
        /\bexecutive\s+brief\b/i.test(draft) && /\brevise\b/i.test(draft) ? '' : draft,
      );
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const requestExecutiveBriefRevision = useCallback(async () => {
    const task = executiveBriefTaskRef.current;
    if (!task || busy) return;
    setBusy(true);
    try {
      const next = await window.kae.requestExecutiveBriefRevision(task.taskId);
      setExecutiveBriefTask(next);
      setComposerDraft(
        `Please revise the executive brief on "${task.evidence.topic}" — keep the same frozen evidence.`,
      );
    } finally {
      setBusy(false);
    }
  }, [busy]);

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
    composerDraft,
    setComposerDraft,
    selectedEvidencePath,
    setSelectedEvidencePath,
    executiveBriefTask,
    approveExecutiveBrief,
    cancelExecutiveBrief,
    requestExecutiveBriefRevision,
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

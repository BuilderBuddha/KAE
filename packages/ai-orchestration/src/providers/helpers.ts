import type { AIProviderId, ReasoningRequest, ReasoningResponse } from '@scooper/core';

const STYLE_PREFIX: Record<Exclude<AIProviderId, 'deterministic'>, string> = {
  mock: "Here's what I found:",
  openai: 'OpenAI summary:',
  claude: 'Claude read on this:',
  gemini: 'Gemini analysis:',
  openrouter: 'OpenRouter synthesis:',
  ollama: 'Local model view:',
};

const STYLE_SUMMARY_PREFIX: Record<Exclude<AIProviderId, 'deterministic'>, string> = {
  mock: 'Supporting detail:',
  openai: 'GPT rationale:',
  claude: 'Claude reasoning:',
  gemini: 'Gemini context:',
  openrouter: 'Router notes:',
  ollama: 'Local notes:',
};

export function offlineStyledResponse(
  request: ReasoningRequest,
  providerId: Exclude<AIProviderId, 'deterministic'>,
  model?: string,
): ReasoningResponse {
  const direct = request.groundedAnswer.directAnswer.trim();
  const summary = request.groundedAnswer.reasonedSummary.trim();
  const prefix = STYLE_PREFIX[providerId];
  const summaryPrefix = STYLE_SUMMARY_PREFIX[providerId];

  const directAnswer = /^here'?s what i found/i.test(direct)
    ? direct.replace(/^here'?s what i found:?\s*/i, `${prefix} `)
    : `${prefix} ${direct}`;

  return {
    providerId,
    model: model ?? 'offline',
    directAnswer,
    reasonedSummary: `${summaryPrefix} ${summary}`,
    usedOfflineFallback: true,
  };
}

export function buildCuratedPrompt(request: ReasoningRequest): string {
  const { context, groundedAnswer } = request;
  const evidenceLines = groundedAnswer.evidenceUsed
    .slice(0, 8)
    .map((item) => `- ${item.label}: ${item.excerpt}`);

  return [
    'You are Vigsy, a grounded knowledge assistant.',
    'Use ONLY the curated evidence below. Do not invent facts or citations.',
    'Return JSON: {"directAnswer":"...","reasonedSummary":"..."}',
    '',
    `Question: ${context.question}`,
    context.campaign ? `Campaign: ${context.campaign}` : '',
    context.objective ? `Objective: ${context.objective}` : '',
    context.blockers.length ? `Blockers: ${context.blockers.join('; ')}` : '',
    context.accomplishments.length ? `Accomplishments: ${context.accomplishments.join('; ')}` : '',
    '',
    'Evidence:',
    ...evidenceLines,
    '',
    `Deterministic draft answer: ${groundedAnswer.directAnswer}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function parseJsonAnswer(text: string): Promise<{ directAnswer: string; reasonedSummary: string } | null> {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as { directAnswer?: string; reasonedSummary?: string };
    if (parsed.directAnswer && parsed.reasonedSummary) {
      return { directAnswer: parsed.directAnswer, reasonedSummary: parsed.reasonedSummary };
    }
  } catch {
    /* fall through */
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { directAnswer?: string; reasonedSummary?: string };
    if (parsed.directAnswer && parsed.reasonedSummary) {
      return { directAnswer: parsed.directAnswer, reasonedSummary: parsed.reasonedSummary };
    }
  } catch {
    return null;
  }
  return null;
}

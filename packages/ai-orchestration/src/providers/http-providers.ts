import type { AIProvider, AIProviderCredentials, ReasoningRequest, ReasoningResponse } from '@scooper/core';
import { buildCuratedPrompt, offlineStyledResponse, parseJsonAnswer } from './helpers.js';

function createHttpProvider(
  id: 'openai' | 'claude' | 'gemini' | 'openrouter' | 'ollama',
  displayName: string,
  defaultModel: string,
  endpoint: (credentials: AIProviderCredentials) => string,
  buildBody: (prompt: string, model: string) => unknown,
  extractText: (payload: unknown) => string | null,
  requiresApiKey: boolean,
): AIProvider {
  return {
    capabilities: {
      id,
      displayName,
      supportsStreaming: false,
      supportsTools: false,
      requiresApiKey,
      offline: false,
      defaultModel,
    },
    async reason(request: ReasoningRequest, credentials?: AIProviderCredentials): Promise<ReasoningResponse> {
      const model = credentials?.model ?? defaultModel;
      if (!credentials?.apiKey && requiresApiKey) {
        return offlineStyledResponse(request, id, model, true);
      }

      const prompt = buildCuratedPrompt(request);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (id === 'claude' && credentials?.apiKey) {
          headers['x-api-key'] = credentials.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else if (credentials?.apiKey) {
          headers.Authorization = `Bearer ${credentials.apiKey}`;
        }

        const response = await fetch(endpoint(credentials ?? {}), {
          method: 'POST',
          headers,
          body: JSON.stringify(buildBody(prompt, model)),
        });

        if (!response.ok) {
          return offlineStyledResponse(request, id, model, true);
        }

        const payload = (await response.json()) as unknown;
        const text = extractText(payload);
        const parsed = text ? await parseJsonAnswer(text) : null;
        if (!parsed) {
          return offlineStyledResponse(request, id, model, true);
        }

        return {
          providerId: id,
          model,
          directAnswer: parsed.directAnswer,
          reasonedSummary: parsed.reasonedSummary,
          usedOfflineFallback: false,
        };
      } catch {
        return offlineStyledResponse(request, id, model, true);
      }
    },
  };
}

export const openAiProvider = createHttpProvider(
  'openai',
  'OpenAI',
  'gpt-4o-mini',
  () => 'https://api.openai.com/v1/chat/completions',
  (prompt, model) => ({
    model,
    messages: [
      { role: 'system', content: 'Respond with JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  }),
  (payload) => {
    const data = payload as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  },
  true,
);

export const claudeProvider = createHttpProvider(
  'claude',
  'Claude',
  'claude-3-5-haiku-latest',
  () => 'https://api.anthropic.com/v1/messages',
  (prompt, model) => ({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }),
  (payload) => {
    const data = payload as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? null;
  },
  true,
);

export const geminiProvider = createHttpProvider(
  'gemini',
  'Gemini',
  'gemini-1.5-flash',
  (credentials) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${credentials.model ?? 'gemini-1.5-flash'}:generateContent?key=${credentials.apiKey ?? ''}`,
  (prompt) => ({
    contents: [{ parts: [{ text: prompt }] }],
  }),
  (payload) => {
    const data = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  },
  true,
);

export const openRouterProvider = createHttpProvider(
  'openrouter',
  'OpenRouter',
  'openai/gpt-4o-mini',
  () => 'https://openrouter.ai/api/v1/chat/completions',
  (prompt, model) => ({
    model,
    messages: [{ role: 'user', content: prompt }],
  }),
  (payload) => {
    const data = payload as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  },
  true,
);

export const ollamaProvider = createHttpProvider(
  'ollama',
  'Local (Ollama)',
  'llama3.2',
  (credentials) => `${credentials.baseUrl ?? 'http://127.0.0.1:11434'}/api/chat`,
  (prompt, model) => ({
    model,
    stream: false,
    messages: [{ role: 'user', content: prompt }],
  }),
  (payload) => {
    const data = payload as { message?: { content?: string } };
    return data.message?.content ?? null;
  },
  false,
);

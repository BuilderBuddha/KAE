import type {
  AIProviderCredentials,
  AIProviderId,
  ProviderHealthResult,
  ReasoningResponse,
} from '@scooper/core';

export function healthForOfflineProvider(
  providerId: AIProviderId,
  supportsStreaming: boolean,
  secureStorage: ProviderHealthResult['secureStorage'],
): ProviderHealthResult {
  return {
    providerId,
    status: 'offline',
    message: 'Provider runs in offline mode (no API key required).',
    supportsStreaming,
    secureStorage,
  };
}

export function healthMissingKey(
  providerId: AIProviderId,
  supportsStreaming: boolean,
  secureStorage: ProviderHealthResult['secureStorage'],
): ProviderHealthResult {
  return {
    providerId,
    status: 'missing_key',
    message: 'API key is not configured. Using fallback responses.',
    supportsStreaming,
    secureStorage,
  };
}

export async function probeOpenAiCompatible(
  providerId: AIProviderId,
  url: string,
  apiKey: string,
  supportsStreaming: boolean,
  secureStorage: ProviderHealthResult['secureStorage'],
): Promise<ProviderHealthResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });
    if (response.ok) {
      return {
        providerId,
        status: 'connected',
        message: 'Provider responded successfully.',
        supportsStreaming,
        secureStorage,
      };
    }
    return {
      providerId,
      status: 'unavailable',
      message: `Provider returned HTTP ${response.status}.`,
      supportsStreaming,
      secureStorage,
    };
  } catch (error) {
    return {
      providerId,
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Provider unreachable.',
      supportsStreaming,
      secureStorage,
    };
  }
}

export async function testProviderHealth(
  providerId: AIProviderId,
  credentials: AIProviderCredentials | undefined,
  secureStorage: ProviderHealthResult['secureStorage'],
  capabilities: { supportsStreaming: boolean; requiresApiKey: boolean; offline: boolean },
): Promise<ProviderHealthResult> {
  if (capabilities.offline || providerId === 'mock' || providerId === 'deterministic') {
    return healthForOfflineProvider(providerId, capabilities.supportsStreaming, secureStorage);
  }

  if (capabilities.requiresApiKey && !credentials?.apiKey) {
    return healthMissingKey(providerId, capabilities.supportsStreaming, secureStorage);
  }

  if (providerId === 'openai' || providerId === 'openrouter') {
    const url =
      providerId === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
    return probeOpenAiCompatible(
      providerId,
      url,
      credentials?.apiKey ?? '',
      capabilities.supportsStreaming,
      secureStorage,
    );
  }

  if (providerId === 'ollama') {
    const base = credentials?.baseUrl ?? 'http://127.0.0.1:11434';
    try {
      const response = await fetch(`${base}/api/tags`);
      if (response.ok) {
        return {
          providerId,
          status: 'connected',
          message: 'Ollama is reachable.',
          supportsStreaming: capabilities.supportsStreaming,
          secureStorage,
        };
      }
    } catch {
      /* fall through */
    }
    return {
      providerId,
      status: 'unavailable',
      message: 'Ollama is not reachable at the configured base URL.',
      supportsStreaming: capabilities.supportsStreaming,
      secureStorage,
    };
  }

  if (!credentials?.apiKey) {
    return healthMissingKey(providerId, capabilities.supportsStreaming, secureStorage);
  }

  return {
    providerId,
    status: 'connected',
    message: 'API key configured. Live verification skipped for this provider.',
    supportsStreaming: capabilities.supportsStreaming,
    secureStorage,
  };
}

export function streamTextAsTokens(
  providerId: AIProviderId,
  field: 'direct_answer' | 'summary',
  text: string,
  onChunk: (chunk: import('@scooper/core').ReasoningStreamChunk) => void,
): void {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (!word) continue;
    onChunk({ kind: 'token', text: word, providerId });
  }
  onChunk({ kind: field, text, providerId });
}

export async function finalizeStreamResponse(
  providerId: import('@scooper/core').AIProviderId,
  directAnswer: string,
  reasonedSummary: string,
  usedOfflineFallback?: boolean,
): Promise<ReasoningResponse> {
  return {
    providerId,
    directAnswer,
    reasonedSummary,
    usedOfflineFallback,
  };
}

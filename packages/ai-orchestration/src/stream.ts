import type { AIProvider } from '@scooper/core';
import { offlineStyledResponse } from './providers/helpers.js';
import { finalizeStreamResponse, streamTextAsTokens } from './health.js';

export function withStreamingFallback(provider: AIProvider): AIProvider {
  if (provider.reasonStream) return provider;

  return {
    ...provider,
    capabilities: { ...provider.capabilities, supportsStreaming: true },
    async reasonStream(request, credentials, onChunk) {
      const response = await provider.reason(request, credentials);
      streamTextAsTokens(response.providerId, 'direct_answer', response.directAnswer, onChunk);
      streamTextAsTokens(response.providerId, 'summary', response.reasonedSummary, onChunk);
      onChunk({ kind: 'done', text: '', providerId: response.providerId });
      return response;
    },
  };
}

export function createStreamingMockProvider(base: AIProvider): AIProvider {
  return {
    ...base,
    capabilities: { ...base.capabilities, supportsStreaming: true },
    async reasonStream(request, _credentials, onChunk) {
      const response = offlineStyledResponse(request, 'mock');
      streamTextAsTokens('mock', 'direct_answer', response.directAnswer, onChunk);
      streamTextAsTokens('mock', 'summary', response.reasonedSummary, onChunk);
      onChunk({ kind: 'done', text: '', providerId: 'mock' });
      return finalizeStreamResponse('mock', response.directAnswer, response.reasonedSummary, true);
    },
  };
}

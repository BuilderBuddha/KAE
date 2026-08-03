import type { AIProvider, ReasoningRequest, ReasoningResponse } from '@scooper/core';

export function createDeterministicProvider(): AIProvider {
  return {
    capabilities: {
      id: 'deterministic',
      displayName: 'Deterministic (no AI)',
      supportsStreaming: false,
      supportsTools: false,
      requiresApiKey: false,
      offline: true,
    },
    async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
      return {
        providerId: 'deterministic',
        model: 'deterministic',
        directAnswer: request.groundedAnswer.directAnswer,
        reasonedSummary: request.groundedAnswer.reasonedSummary,
        usedOfflineFallback: false,
      };
    },
  };
}

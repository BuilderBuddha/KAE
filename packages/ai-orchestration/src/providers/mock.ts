import type { AIProvider, ReasoningRequest, ReasoningResponse } from '@scooper/core';
import { offlineStyledResponse } from './helpers.js';

export function createMockProvider(): AIProvider {
  return {
    capabilities: {
      id: 'mock',
      displayName: 'Mock (offline)',
      supportsStreaming: true,
      supportsTools: false,
      requiresApiKey: false,
      offline: true,
      defaultModel: 'mock-v1',
    },
    async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
      // Intentional offline mock — grounded draft, not a failed live call.
      return offlineStyledResponse(request, 'mock', 'mock-v1', false);
    },
  };
}

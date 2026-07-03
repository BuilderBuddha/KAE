import type {
  AIProvider,
  AIProviderCredentials,
  AIProviderId,
  ProviderCapabilities,
  ProviderHealthResult,
  ReasoningRequest,
  ReasoningResponse,
  ReasoningStreamChunk,
} from '@scooper/core';
import { createMockProvider } from './providers/mock.js';
import { createDeterministicProvider } from './providers/deterministic.js';
import {
  claudeProvider,
  geminiProvider,
  ollamaProvider,
  openAiProvider,
  openRouterProvider,
} from './providers/http-providers.js';
import { testProviderHealth } from './health.js';
import { createStreamingMockProvider, withStreamingFallback } from './stream.js';

/** Routes reasoning to registered providers with runtime switching. */
export class AIProviderManager {
  private readonly providers = new Map<AIProviderId, AIProvider>();
  private activeId: AIProviderId = 'mock';
  private credentials: AIProviderCredentials = {};
  private secureStorageMode: ProviderHealthResult['secureStorage'] = 'dev_fallback';

  constructor(seedProviders?: AIProvider[]) {
    for (const provider of seedProviders ?? createDefaultProviders()) {
      this.providers.set(provider.capabilities.id, withStreamingFallback(provider));
    }
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.capabilities.id, provider);
  }

  setActive(providerId: AIProviderId): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Unknown AI provider: ${providerId}`);
    }
    this.activeId = providerId;
  }

  getActiveId(): AIProviderId {
    return this.activeId;
  }

  getActive(): AIProvider {
    const provider = this.providers.get(this.activeId);
    if (!provider) throw new Error(`Active provider not registered: ${this.activeId}`);
    return provider;
  }

  setCredentials(credentials: AIProviderCredentials): void {
    this.credentials = { ...credentials };
  }

  setSecureStorageMode(mode: ProviderHealthResult['secureStorage']): void {
    this.secureStorageMode = mode;
  }

  listCapabilities(): ProviderCapabilities[] {
    return [...this.providers.values()].map((provider) => provider.capabilities);
  }

  async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
    return this.getActive().reason(request, this.credentials);
  }

  async reasonStream(
    request: ReasoningRequest,
    onChunk: (chunk: ReasoningStreamChunk) => void,
  ): Promise<ReasoningResponse> {
    const provider = this.getActive();
    if (this.credentials.streaming && provider.reasonStream) {
      return provider.reasonStream(request, this.credentials, onChunk);
    }
    const response = await provider.reason(request, this.credentials);
    onChunk({ kind: 'direct_answer', text: response.directAnswer, providerId: response.providerId });
    onChunk({ kind: 'summary', text: response.reasonedSummary, providerId: response.providerId });
    onChunk({ kind: 'done', text: '', providerId: response.providerId });
    return response;
  }

  async testActiveProviderHealth(): Promise<ProviderHealthResult> {
    const provider = this.getActive();
    return testProviderHealth(
      provider.capabilities.id,
      this.credentials,
      this.secureStorageMode,
      provider.capabilities,
    );
  }

  async testProviderHealth(providerId: AIProviderId): Promise<ProviderHealthResult> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Unknown AI provider: ${providerId}`);
    return testProviderHealth(
      providerId,
      this.credentials,
      this.secureStorageMode,
      provider.capabilities,
    );
  }
}

export function createDefaultProviders(): AIProvider[] {
  return [
    createDeterministicProvider(),
    createStreamingMockProvider(createMockProvider()),
    withStreamingFallback(openAiProvider),
    withStreamingFallback(claudeProvider),
    withStreamingFallback(geminiProvider),
    withStreamingFallback(openRouterProvider),
    withStreamingFallback(ollamaProvider),
  ];
}

export function createDefaultAIProviderManager(): AIProviderManager {
  return new AIProviderManager();
}

let sharedManager: AIProviderManager | null = null;

export function getSharedAIProviderManager(): AIProviderManager {
  if (!sharedManager) {
    sharedManager = createDefaultAIProviderManager();
  }
  return sharedManager;
}

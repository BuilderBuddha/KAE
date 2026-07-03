import type {
  AIProvider,
  AIProviderCredentials,
  AIProviderId,
  ProviderCapabilities,
  ReasoningRequest,
  ReasoningResponse,
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

/** Routes reasoning to registered providers with runtime switching. */
export class AIProviderManager {
  private readonly providers = new Map<AIProviderId, AIProvider>();
  private activeId: AIProviderId = 'mock';
  private credentials: AIProviderCredentials = {};

  constructor(seedProviders?: AIProvider[]) {
    for (const provider of seedProviders ?? createDefaultProviders()) {
      this.providers.set(provider.capabilities.id, provider);
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

  listCapabilities(): ProviderCapabilities[] {
    return [...this.providers.values()].map((provider) => provider.capabilities);
  }

  async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
    return this.getActive().reason(request, this.credentials);
  }
}

export function createDefaultProviders(): AIProvider[] {
  return [
    createDeterministicProvider(),
    createMockProvider(),
    openAiProvider,
    claudeProvider,
    geminiProvider,
    openRouterProvider,
    ollamaProvider,
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

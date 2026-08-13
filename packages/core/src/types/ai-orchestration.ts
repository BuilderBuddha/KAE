import type { VigsyConversationFollowUpContext } from './vigsy-conversation.js';
import type { ExecutiveBriefing } from './executive-awareness.js';
import type { ExecutiveSessionRecord } from './executive-memory.js';
import type { VigsyRelationshipInsights } from './knowledge-relationship.js';
import type { AssembledEvidenceContext, VigsyKnowledgeAnswer } from './vigsy-reasoning.js';

/** Supported AI provider identifiers. */
export type AIProviderId =
  | 'deterministic'
  | 'mock'
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'openrouter'
  | 'ollama';

export interface ProviderCapabilities {
  id: AIProviderId;
  displayName: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  requiresApiKey: boolean;
  offline: boolean;
  defaultModel?: string;
}

export interface ConversationTurnSummary {
  role: 'user' | 'assistant';
  text: string;
}

/** Curated conversation state passed to providers — never raw repository access. */
export interface ConversationContext {
  conversationId?: string;
  turns: ConversationTurnSummary[];
  followUpContext?: VigsyConversationFollowUpContext;
}

/** Full curated reasoning context assembled by KAE before any provider call. */
export interface ReasoningContext {
  question: string;
  repositoryPath: string;
  conversation: ConversationContext;
  executiveMemory: ExecutiveSessionRecord | null;
  evidence: AssembledEvidenceContext;
  relationshipInsights?: VigsyRelationshipInsights;
  executiveBriefing: ExecutiveBriefing | null;
  campaign?: string;
  objective?: string;
  blockers: string[];
  accomplishments: string[];
  repositorySummary?: string;
}

/** Provider input — grounded skeleton plus curated context. */
export interface ReasoningRequest {
  context: ReasoningContext;
  groundedAnswer: VigsyKnowledgeAnswer;
}

/** Provider output — prose only; evidence fields are applied by KAE. */
export interface ReasoningResponse {
  providerId: AIProviderId;
  model?: string;
  directAnswer: string;
  reasonedSummary: string;
  usedOfflineFallback?: boolean;
}

export interface AIProviderCredentials {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  streaming?: boolean;
}

export type ProviderHealthStatus =
  | 'connected'
  | 'missing_key'
  | 'unavailable'
  | 'offline'
  | 'fallback';

export interface ProviderHealthResult {
  providerId: AIProviderId;
  status: ProviderHealthStatus;
  message: string;
  supportsStreaming: boolean;
  secureStorage: 'available' | 'dev_fallback';
}

export interface ReasoningStreamChunk {
  kind: 'token' | 'direct_answer' | 'summary' | 'done';
  text: string;
  providerId: AIProviderId;
}

/** Pluggable AI reasoning provider — must not mutate memory or invent evidence. */
export interface AIProvider {
  readonly capabilities: ProviderCapabilities;
  reason(request: ReasoningRequest, credentials?: AIProviderCredentials): Promise<ReasoningResponse>;
  reasonStream?(
    request: ReasoningRequest,
    credentials: AIProviderCredentials | undefined,
    onChunk: (chunk: ReasoningStreamChunk) => void,
  ): Promise<ReasoningResponse>;
  testHealth?(credentials?: AIProviderCredentials): Promise<ProviderHealthResult>;
}

export interface AnswerKnowledgeOptions {
  providerId?: AIProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  streaming?: boolean;
  conversationContext?: ConversationContext;
  /**
   * Explicit UI-selected source KRC IDs (e.g. from explorer selection).
   * Selection authority lives outside the model; may be narrowed by named KRCs in the question.
   */
  selectedSourceIds?: string[];
}

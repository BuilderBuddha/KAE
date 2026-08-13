import type { SourceScopeAuthorization, VigsyQuestionIntent } from '@scooper/core';
import { extractExactKrcIds, normalizeSelectedSourceIds } from './krc-ids.js';

export interface ResolveSourceScopeInput {
  question: string;
  intent: VigsyQuestionIntent;
  selectedSourceIds?: string[] | null;
}

/**
 * Resolve authorized source set outside the model.
 * Any exact KRC named in the question creates named_in_question scope before retrieval.
 * NL may narrow UI selection; never silently broaden.
 * "Compare" alone is not multi-source authority.
 */
export function resolveSourceScope(input: ResolveSourceScopeInput): SourceScopeAuthorization {
  const named = extractExactKrcIds(input.question);
  const ui = normalizeSelectedSourceIds(input.selectedSourceIds);

  if (ui.length > 0 && named.length > 0) {
    const narrowed = named.filter((id) => ui.includes(id));
    // Narrow when the question names a subset; otherwise keep UI set (no broaden via extra names).
    return {
      authorizedKrcIds: narrowed.length > 0 ? narrowed : ui,
      authority: 'named_and_ui',
    };
  }

  if (ui.length > 0) {
    return { authorizedKrcIds: ui, authority: 'ui_selection' };
  }

  // Locked D rule: any valid exact KRC in the question scopes retrieval to those KRCs only.
  if (named.length > 0) {
    return { authorizedKrcIds: named, authority: 'named_in_question' };
  }

  return { authorizedKrcIds: [], authority: 'none' };
}

/** KRC ids that must be force-resolved even when the corpus stays unscoped. */
export function krcIdsToForceInclude(
  question: string,
  scope: SourceScopeAuthorization,
): string[] {
  if (scope.authorizedKrcIds.length > 0) return [...scope.authorizedKrcIds];
  return extractExactKrcIds(question);
}

export function recordBelongsToAuthorizedScope(
  krcId: string | undefined,
  scope: SourceScopeAuthorization,
): boolean {
  if (scope.authority === 'none' || scope.authorizedKrcIds.length === 0) return true;
  if (!krcId) return false;
  return scope.authorizedKrcIds.includes(krcId.toUpperCase());
}

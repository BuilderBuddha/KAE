/**
 * Pure helpers for Phase 2 / 2.1 persistent investigation composer contracts.
 * Desktop UI imports these; acceptance scripts mirror the same rules.
 */

export function shouldRenderInlineComposer(input: {
  hasConversation: boolean;
  isKaydHome: boolean;
  workspaceScreen?: string | null;
  dockScreens?: readonly string[];
}): boolean {
  if (input.isKaydHome) return true;
  if (
    input.hasConversation &&
    input.workspaceScreen &&
    (input.dockScreens ?? []).includes(input.workspaceScreen)
  ) {
    return false;
  }
  return true;
}

export function shouldRenderInvestigationDock(input: {
  hasConversation: boolean;
  screen: string;
  dockScreens: readonly string[];
}): boolean {
  return input.hasConversation && input.dockScreens.includes(input.screen);
}

/** Draft ownership: provider draft wins; never replace with investigation searchQuery. */
export function resolveComposerDraft(input: {
  providerDraft: string;
  investigationSearchQuery?: string | null;
}): string {
  void input.investigationSearchQuery;
  return input.providerDraft;
}

export function countKayDComposerMarkers(source: string): number {
  const ids = source.match(/\bid=["'](?:vigsy-unified-composer|kayd-workspace-composer)["']/g);
  return ids?.length ?? 0;
}

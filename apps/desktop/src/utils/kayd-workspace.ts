import type { ScreenId } from '../types/navigation';

/** Shared composer across executive workspaces — navigation does not reset the shell. */
export const KAYD_WORKSPACE_COMPOSER_ID = 'kayd-workspace-composer';

/** Home KayD composer id — mutually exclusive with the investigation dock. */
export const KAYD_HOME_COMPOSER_ID = 'vigsy-unified-composer';

/**
 * Supporting views that host the persistent investigation dock once a conversation exists.
 * Includes Knowledge Sources (import/connectors) — navigation alone must never hide the dock.
 */
export const KAYD_INVESTIGATION_DOCK_SCREENS: readonly ScreenId[] = [
  'dashboard',
  'search',
  'explorer',
  'import',
  'connectors',
];

/**
 * Durable dock visibility: at least one real exchange exists, and the screen is a supporting view.
 * Not gated on investigationActive — missing local page context must not hide the composer.
 * Ends only when the conversation is cleared / new (hasConversation becomes false).
 */
export function showsInvestigationDock(screen: ScreenId, hasConversation: boolean): boolean {
  return hasConversation && (KAYD_INVESTIGATION_DOCK_SCREENS as readonly string[]).includes(screen);
}

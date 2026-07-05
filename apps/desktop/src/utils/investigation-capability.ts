import type { ScreenId } from '../types/navigation';
import {
  investigationViewFromLens,
  type InvestigationView,
} from './investigation-workflow';

/** Best workspace screen for a capability lens. */
export function investigationScreenForView(view: InvestigationView): ScreenId | null {
  switch (view) {
    case 'timeline':
    case 'images':
    case 'videos':
    case 'repository':
    case 'conversation':
      return 'explorer';
    case 'sources':
    case 'related':
      return 'search';
    case 'confidence':
    case 'why':
    case 'summarize':
      return 'vigsy';
    default:
      return null;
  }
}

/** Primary capability owned by a workspace — no duplicate lens panel needed. */
export function screenPrimaryView(screen: string): InvestigationView | null {
  switch (screen) {
    case 'search':
      return 'sources';
    case 'explorer':
      return 'repository';
    default:
      return null;
  }
}

/** True when this screen already renders the active lens natively. */
export function screenShowsLensNatively(screen: string, lens: string | null): boolean {
  const view = investigationViewFromLens(lens);
  if (!view) return false;
  if (screenPrimaryView(screen) === view) return true;
  if (screen === 'explorer') {
    return (
      view === 'timeline' ||
      view === 'images' ||
      view === 'videos' ||
      view === 'repository' ||
      view === 'conversation'
    );
  }
  return false;
}

/** Screen-native KayD line — unique context, not a repeat of the investigation brief. */
export function investigationCapabilityLead(
  screen: string,
  topic: string,
  lens: string | null,
  busy: boolean,
): string {
  if (busy) return 'Pulling that together…';

  const view = investigationViewFromLens(lens);
  if (view === 'timeline') return `Timeline view for "${topic}" — scan dates below.`;
  if (view === 'images') return `Visuals for "${topic}" — review what's below.`;
  if (view === 'sources') return `Source index for "${topic}" — hits are below.`;

  switch (screen) {
    case 'search':
      return `Source index for "${topic}" — I've kept the thread warm while you scan hits.`;
    case 'explorer':
      return `Files on "${topic}" — open what you need from the tree below.`;
    case 'import':
      return `Knowledge sources for "${topic}" — manage connectors below.`;
    case 'connectors':
      return `Connector health for "${topic}" — check sync status below.`;
    case 'dashboard':
      return `Health context for "${topic}" — use repair tools below as needed.`;
    case 'vigsy':
      return lens ? `Still on "${topic}" — ask me to go deeper.` : `Working "${topic}" with you.`;
    default:
      return `Supporting "${topic}" from here.`;
  }
}

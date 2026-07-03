export type ScreenId =
  | 'dashboard'
  | 'import'
  | 'connectors'
  | 'explorer'
  | 'search'
  | 'vigsy'
  | 'repository'
  | 'jobs'
  | 'logs'
  | 'settings';

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'vigsy',
    label: 'KayD',
    icon: '✦',
    description: 'Talk to KayD — executive intelligence',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '◉',
    description: 'KayD briefing and repository overview',
  },
  {
    id: 'import',
    label: 'Knowledge Sources',
    icon: '↓',
    description: 'Connect knowledge sources to your repository',
  },
  {
    id: 'explorer',
    label: 'Repository',
    icon: '◈',
    description: 'Browse knowledge, sources, and registries',
  },
  {
    id: 'search',
    label: 'Search',
    icon: '⌕',
    description: 'Search imported knowledge',
  },
  {
    id: 'jobs',
    label: 'Job Queue',
    icon: '⏱',
    description: 'Monitor acquisition jobs',
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: '≡',
    description: 'View application logs',
  },
  {
    id: 'repository',
    label: 'Settings',
    icon: '⚙',
    description: 'Configure Axiom Knowledge Repository',
  },
  {
    id: 'settings',
    label: 'Preferences',
    icon: '☰',
    description: 'Application preferences',
  },
];

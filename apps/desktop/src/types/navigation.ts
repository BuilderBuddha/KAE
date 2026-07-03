export type ScreenId =
  | 'dashboard'
  | 'import'
  | 'explorer'
  | 'search'
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
    id: 'dashboard',
    label: 'Dashboard',
    icon: '◉',
    description: 'Import status and repository overview',
  },
  {
    id: 'import',
    label: 'Import',
    icon: '↓',
    description: 'Acquire knowledge from external sources',
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

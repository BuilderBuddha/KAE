import { NAV_ITEMS, type ScreenId } from '../types/navigation';

interface NavigationProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  compact?: boolean;
}

const PRIMARY_IDS: ScreenId[] = ['vigsy'];
const REPOSITORY_IDS: ScreenId[] = ['dashboard', 'import', 'connectors', 'explorer', 'search'];
const SYSTEM_IDS: ScreenId[] = ['jobs', 'logs', 'repository', 'settings'];

function NavSection({
  label,
  items,
  activeScreen,
  onNavigate,
  compact,
}: {
  label: string;
  items: typeof NAV_ITEMS;
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="nav__section">
      {!compact ? <p className="nav__section-label">{label}</p> : null}
      <ul className="nav__list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`nav__item${activeScreen === item.id ? ' nav__item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={activeScreen === item.id ? 'page' : undefined}
              title={compact ? item.label : undefined}
            >
              <span className="nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              {!compact ? (
                <span className="nav__text">
                  <span className="nav__label">{item.label}</span>
                  <span className="nav__description">{item.description}</span>
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Navigation({ activeScreen, onNavigate, compact = false }: NavigationProps) {
  const primary = NAV_ITEMS.filter((item) => PRIMARY_IDS.includes(item.id));
  const repository = NAV_ITEMS.filter((item) => REPOSITORY_IDS.includes(item.id));
  const system = NAV_ITEMS.filter((item) => SYSTEM_IDS.includes(item.id));

  return (
    <nav className="nav" aria-label="Main navigation">
      <NavSection
        label="KayD"
        items={primary}
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        compact={compact}
      />
      <NavSection
        label="Repository"
        items={repository}
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        compact={compact}
      />
      <NavSection
        label="System"
        items={system}
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        compact={compact}
      />
    </nav>
  );
}

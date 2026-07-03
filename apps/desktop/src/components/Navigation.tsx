import { NAV_ITEMS, type ScreenId } from '../types/navigation';

interface NavigationProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export function Navigation({ activeScreen, onNavigate }: NavigationProps) {
  return (
    <nav className="nav" aria-label="Main navigation">
      <ul className="nav__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`nav__item${activeScreen === item.id ? ' nav__item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={activeScreen === item.id ? 'page' : undefined}
            >
              <span className="nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav__text">
                <span className="nav__label">{item.label}</span>
                <span className="nav__description">{item.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

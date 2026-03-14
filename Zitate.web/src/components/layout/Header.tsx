/**
 * Header Component
 */
import './Header.css';

interface HeaderProps {
  onCreateClick: () => void;
}

export function Header({ onCreateClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Zitate</h1>
        <button
          className="header-create-btn"
          onClick={onCreateClick}
          aria-label="Create new entry"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="header-create-text">New Quote</span>
        </button>
      </div>
    </header>
  );
}

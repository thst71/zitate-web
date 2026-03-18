/**
 * Header Component
 */
import './Header.css';

interface HeaderProps {
  onCreateClick: () => void;
  onDataManagementClick?: () => void;
}

export function Header({ onCreateClick, onDataManagementClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Zitate</h1>
        <div className="header-actions">
          {onDataManagementClick && (
            <button
              className="header-action-btn"
              onClick={onDataManagementClick}
              aria-label="Data management"
              title="Backup & Restore"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          )}
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
      </div>
    </header>
  );
}

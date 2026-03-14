import React from 'react';
import { Entry } from '../../models';
import { formatCoordinates } from '../../services/location.service';
import './EntryCard.css';

interface EntryCardProps {
  entry: Entry;
  onDelete?: (id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this entry?')) {
      onDelete(entry.id);
    }
  };

  const hasLocation = entry.latitude !== undefined && entry.longitude !== undefined;

  return (
    <div className="entry-card">
      <div className="entry-card-content">
        <p className="entry-text">{entry.text}</p>

        <div className="entry-meta">
          <span className="entry-date">{formatDate(entry.createdAt)}</span>

          {hasLocation && (
            <span className="entry-location">
              <svg
                className="location-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {formatCoordinates(entry.latitude!, entry.longitude!)}
            </span>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          className="entry-delete"
          onClick={handleDelete}
          aria-label="Delete entry"
          title="Delete entry"
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
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

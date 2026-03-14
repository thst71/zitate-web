import React from 'react';
import { Entry } from '../../models';
import { EntryCard } from './EntryCard';
import './EntryList.css';

interface EntryListProps {
  entries: Entry[];
  loading?: boolean;
  error?: string;
  onDeleteEntry?: (id: string) => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  loading = false,
  error,
  onDeleteEntry,
}) => {
  if (loading) {
    return (
      <div className="entry-list-empty">
        <div className="spinner"></div>
        <p>Loading entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-list-empty error">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="entry-list-empty">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <h2>No Entries Yet</h2>
        <p>Tap the + button to create your first entry</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onDelete={onDeleteEntry} />
      ))}
    </div>
  );
};

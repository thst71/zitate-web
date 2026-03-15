/**
 * FolderCard Component - Display a smart folder
 */
import React from 'react';
import { SmartFolder } from '../../models';
import './FolderCard.css';

interface FolderCardProps {
  folder: SmartFolder;
  count: number;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  count,
  onClick,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete folder "${folder.name}"?`)) {
      onDelete(folder.id);
    }
  };

  return (
    <div className="folder-card" onClick={onClick}>
      <div className="folder-card-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div className="folder-card-content">
        <h3 className="folder-name">{folder.name}</h3>
        <p className="folder-count">
          {count} {count === 1 ? 'entry' : 'entries'}
        </p>
      </div>
      {onDelete && (
        <button
          className="folder-delete"
          onClick={handleDelete}
          aria-label={`Delete folder ${folder.name}`}
          title="Delete folder"
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
          </svg>
        </button>
      )}
    </div>
  );
};

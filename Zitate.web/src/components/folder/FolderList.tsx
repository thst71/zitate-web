/**
 * FolderList Component - Display list of smart folders
 */
import React from 'react';
import { SmartFolder, Entry } from '../../models';
import { FolderCard } from './FolderCard';
import './FolderList.css';

interface FolderListProps {
  folders: SmartFolder[];
  entries: Entry[];
  getFolderCount: (entries: Entry[], folder: SmartFolder) => number;
  onFolderClick?: (folder: SmartFolder) => void;
  onDeleteFolder?: (id: string) => void;
}

export const FolderList: React.FC<FolderListProps> = ({
  folders,
  entries,
  getFolderCount,
  onFolderClick,
  onDeleteFolder,
}) => {
  if (folders.length === 0) {
    return null; // Don't show anything if no folders
  }

  return (
    <div className="folder-list-section">
      <h2 className="folder-list-title">Smart Folders</h2>
      <div className="folder-list">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            count={getFolderCount(entries, folder)}
            onClick={() => onFolderClick?.(folder)}
            onDelete={onDeleteFolder}
          />
        ))}
      </div>
    </div>
  );
};

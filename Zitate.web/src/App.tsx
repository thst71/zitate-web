import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Layout } from './components/layout/Layout';
import { Modal } from './components/common/Modal';
import { EntryForm } from './components/entry/EntryForm';
import { EntryList } from './components/entry/EntryList';
import { SearchBar } from './components/search/SearchBar';
import { FolderList } from './components/folder/FolderList';
import { FolderForm } from './components/folder/FolderForm';
import { useEntries } from './hooks/useEntries';
import { useSearch } from './hooks/useSearch';
import { useFolders } from './hooks/useFolders';
import type { SmartFolder } from './models';

const App: React.FC = () => {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<SmartFolder | null>(null);
  const { entries, loading, error, addEntry, deleteEntry } = useEntries();
  const { searchQuery, filteredEntries, handleSearch, isSearching } = useSearch(entries);
  const {
    folders,
    addFolder,
    deleteFolder,
    filterByFolder,
    getFolderCount,
  } = useFolders();

  const handleCreateEntryClick = () => {
    setIsEntryModalOpen(true);
  };

  const handleCreateFolderClick = () => {
    setIsFolderModalOpen(true);
  };

  const handleCloseEntryModal = () => {
    setIsEntryModalOpen(false);
  };

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
  };

  const handleSaveEntry = async (
    text: string,
    latitude?: number,
    longitude?: number,
    authorId?: string,
    labelIds?: string[]
  ) => {
    await addEntry(text, latitude, longitude, authorId, labelIds);
    setIsEntryModalOpen(false);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
  };

  const handleSaveFolder = async (
    name: string,
    criteria: SmartFolder['criteria']
  ) => {
    await addFolder(name, criteria);
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
  };

  const handleFolderClick = (folder: SmartFolder) => {
    setSelectedFolder(folder);
  };

  const handleClearFolderFilter = () => {
    setSelectedFolder(null);
  };

  // Determine which entries to display
  let displayEntries = entries;
  if (selectedFolder) {
    displayEntries = filterByFolder(entries, selectedFolder);
  } else if (isSearching) {
    displayEntries = filteredEntries;
  }

  return (
    <Layout>
      <Header onCreateClick={handleCreateEntryClick} />
      <SearchBar onSearch={handleSearch} />

      {!isSearching && !selectedFolder && (
        <FolderList
          folders={folders}
          entries={entries}
          getFolderCount={getFolderCount}
          onFolderClick={handleFolderClick}
          onDeleteFolder={handleDeleteFolder}
        />
      )}

      {selectedFolder && (
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <button
              onClick={handleClearFolderFilter}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--spacing-xs)',
                color: 'var(--color-primary)',
              }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0 }}>{selectedFolder.name}</h2>
          </div>
        </div>
      )}

      <EntryList
        entries={displayEntries}
        loading={loading}
        error={error}
        onDeleteEntry={handleDeleteEntry}
      />

      <button
        onClick={handleCreateFolderClick}
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-xl)',
          right: 'calc(var(--spacing-xl) + 60px)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
        title="Create smart folder"
      >
        📁
      </button>

      <Modal
        isOpen={isEntryModalOpen}
        onClose={handleCloseEntryModal}
        title="New Entry"
      >
        <EntryForm onSave={handleSaveEntry} onCancel={handleCloseEntryModal} />
      </Modal>

      <Modal
        isOpen={isFolderModalOpen}
        onClose={handleCloseFolderModal}
        title="Create Smart Folder"
      >
        <FolderForm
          onSave={handleSaveFolder}
          onCancel={handleCloseFolderModal}
        />
      </Modal>
    </Layout>
  );
};

export default App;

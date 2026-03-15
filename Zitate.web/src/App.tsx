import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Layout } from './components/layout/Layout';
import { Modal } from './components/common/Modal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { EntryForm } from './components/entry/EntryForm';
import { EntryList } from './components/entry/EntryList';
import { SearchBar } from './components/search/SearchBar';
import { FolderList } from './components/folder/FolderList';
import { FolderForm } from './components/folder/FolderForm';
import { useEntries } from './hooks/useEntries';
import { useSearch } from './hooks/useSearch';
import { useFolders } from './hooks/useFolders';
import type { SmartFolder, Entry } from './models';
import type { SelectedImage } from './components/image/ImageUpload';

const App: React.FC = () => {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<SmartFolder | null>(null);
  const { entries, loading, error, addEntry, updateEntry, deleteEntry } = useEntries();
  const { filteredEntries, handleSearch, isSearching } = useSearch(entries);
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
    setEditingEntry(null);
  };

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
  };

  const handleSaveEntry = async (
    text: string,
    latitude?: number,
    longitude?: number,
    authorId?: string,
    labelIds?: string[],
    selectedImages?: SelectedImage[]
  ) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, text, authorId, labelIds);
    } else {
      await addEntry(text, latitude, longitude, authorId, labelIds, selectedImages);
    }
    setIsEntryModalOpen(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleDeleteEntryClick = (id: string) => {
    setDeletingEntryId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingEntryId) {
      await deleteEntry(deletingEntryId);
      setDeletingEntryId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingEntryId(null);
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
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntryClick}
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
        title={editingEntry ? 'Edit Entry' : 'New Entry'}
      >
        <EntryForm
          onSave={handleSaveEntry}
          onCancel={handleCloseEntryModal}
          initialEntry={editingEntry ?? undefined}
        />
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

      <ConfirmDialog
        isOpen={!!deletingEntryId}
        title="Delete Entry"
        message={
          deletingEntryId
            ? `Are you sure you want to delete this entry? "${
                entries.find((e) => e.id === deletingEntryId)?.text.slice(0, 100) || ''
              }${
                entries.find((e) => e.id === deletingEntryId)?.text.length! > 100
                  ? '...'
                  : ''
              }"`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
      />
    </Layout>
  );
};

export default App;

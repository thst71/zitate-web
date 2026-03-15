import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Layout } from './components/layout/Layout';
import { Modal } from './components/common/Modal';
import { EntryForm } from './components/entry/EntryForm';
import { EntryList } from './components/entry/EntryList';
import { useEntries } from './hooks/useEntries';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { entries, loading, error, addEntry, deleteEntry } = useEntries();

  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveEntry = async (
    text: string,
    latitude?: number,
    longitude?: number,
    authorId?: string,
    labelIds?: string[]
  ) => {
    await addEntry(text, latitude, longitude, authorId, labelIds);
    setIsModalOpen(false);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
  };

  return (
    <Layout>
      <Header onCreateClick={handleCreateClick} />
      <EntryList
        entries={entries}
        loading={loading}
        error={error}
        onDeleteEntry={handleDeleteEntry}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Entry"
      >
        <EntryForm onSave={handleSaveEntry} onCancel={handleCloseModal} />
      </Modal>
    </Layout>
  );
};

export default App;

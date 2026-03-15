/**
 * AuthorSelect Component - Dropdown to select or create an author
 */
import React, { useState } from 'react';
import { useAuthors } from '../../hooks/useAuthors';
import './AuthorSelect.css';

interface AuthorSelectProps {
  selectedAuthorId?: string;
  onSelect: (authorId: string | undefined) => void;
}

export const AuthorSelect: React.FC<AuthorSelectProps> = ({
  selectedAuthorId,
  onSelect,
}) => {
  const { authors, loading, addAuthor } = useAuthors();
  const [isCreating, setIsCreating] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__create__') {
      setIsCreating(true);
    } else {
      onSelect(value || undefined);
    }
  };

  const handleCreateAuthor = async () => {
    if (!newAuthorName.trim()) {
      setCreateError('Author name cannot be empty');
      return;
    }

    try {
      setCreateError(null);
      const author = await addAuthor(newAuthorName);
      onSelect(author.id);
      setIsCreating(false);
      setNewAuthorName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create author');
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewAuthorName('');
    setCreateError(null);
  };

  if (isCreating) {
    return (
      <div className="author-create">
        <label htmlFor="new-author" className="form-label">
          New Author Name
        </label>
        <input
          id="new-author"
          type="text"
          className="form-input"
          value={newAuthorName}
          onChange={(e) => setNewAuthorName(e.target.value)}
          placeholder="Enter author name..."
          autoFocus
          maxLength={200}
        />
        {createError && (
          <span className="error-message">{createError}</span>
        )}
        <div className="author-create-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCancelCreate}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCreateAuthor}
          >
            Create
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="author-select">
      <label htmlFor="author-select" className="form-label">
        Author (Optional)
      </label>
      <select
        id="author-select"
        className="form-select"
        value={selectedAuthorId || ''}
        onChange={handleSelectChange}
        disabled={loading}
      >
        <option value="">No author</option>
        {authors.map((author) => (
          <option key={author.id} value={author.id}>
            {author.name}
          </option>
        ))}
        <option value="__create__">+ Create new author...</option>
      </select>
    </div>
  );
};

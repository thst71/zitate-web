/**
 * FolderForm Component - Form for creating/editing smart folders
 */
import React, { useState } from 'react';
import { SmartFolder } from '../../models';
import { validateFolderName } from '../../utils/validators';
import { AuthorSelect } from '../author/AuthorSelect';
import { LabelInput } from '../label/LabelInput';
import './FolderForm.css';

interface FolderFormProps {
  onSave: (name: string, criteria: SmartFolder['criteria']) => Promise<void>;
  onCancel: () => void;
  initialFolder?: SmartFolder;
}

export const FolderForm: React.FC<FolderFormProps> = ({
  onSave,
  onCancel,
  initialFolder,
}) => {
  const [name, setName] = useState(initialFolder?.name || '');
  const [authorId, setAuthorId] = useState<string | undefined>(
    initialFolder?.criteria.authorId
  );
  const [labelIds, setLabelIds] = useState<string[]>(
    initialFolder?.criteria.labels?.values || []
  );
  const [textMatch, setTextMatch] = useState(
    initialFolder?.criteria.textMatch || ''
  );
  const [hasLocation, setHasLocation] = useState<boolean | undefined>(
    initialFolder?.criteria.hasLocation
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = validateFolderName(name);
  const isValid = validation.isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setSaving(true);
    setError(null);

    const criteria: SmartFolder['criteria'] = {
      labels: labelIds.length > 0 ? { values: labelIds, operator: 'OR' as const } : undefined,
      authorId: authorId || undefined,
      textMatch: textMatch.trim() || undefined,
      hasLocation: hasLocation,
    };

    try {
      await onSave(name, criteria);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save folder');
      setSaving(false);
    }
  };

  return (
    <form className="folder-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="folder-name" className="form-label">
          Folder Name <span className="required">*</span>
        </label>
        <input
          id="folder-name"
          type="text"
          className={`form-input ${!isValid && name ? 'invalid' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter folder name..."
          autoFocus
          maxLength={100}
        />
        {!isValid && name && (
          <span className="error-message">{validation.error}</span>
        )}
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Filter Criteria</h3>
        <p className="form-section-hint">
          Select criteria to automatically include entries in this folder.
          Leave empty to match all entries.
        </p>

        <AuthorSelect selectedAuthorId={authorId} onSelect={setAuthorId} />

        <LabelInput selectedLabelIds={labelIds} onLabelsChange={setLabelIds} />

        <div className="form-group">
          <label htmlFor="text-contains" className="form-label">
            Text Contains
          </label>
          <input
            id="text-contains"
            type="text"
            className="form-input"
            value={textMatch}
            onChange={(e) => setTextMatch(e.target.value)}
            placeholder="Enter text to search for..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="location-any"
                name="hasLocation"
                checked={hasLocation === undefined}
                onChange={() => setHasLocation(undefined)}
              />
              <label htmlFor="location-any">Any (with or without location)</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="location-with"
                name="hasLocation"
                checked={hasLocation === true}
                onChange={() => setHasLocation(true)}
              />
              <label htmlFor="location-with">With location</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="location-without"
                name="hasLocation"
                checked={hasLocation === false}
                onChange={() => setHasLocation(false)}
              />
              <label htmlFor="location-without">Without location</label>
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid || saving}
        >
          {saving ? 'Saving...' : initialFolder ? 'Update Folder' : 'Create Folder'}
        </button>
      </div>
    </form>
  );
};

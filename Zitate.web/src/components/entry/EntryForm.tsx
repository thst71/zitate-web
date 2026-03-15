/**
 * EntryForm Component - Form for creating/editing entries
 */
import { useState, FormEvent } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { validateEntryText } from '../../utils/validators';
import { AuthorSelect } from '../author/AuthorSelect';
import { LabelInput } from '../label/LabelInput';
import { ImageUpload, type SelectedImage } from '../image/ImageUpload';
import type { Entry } from '../../models';
import './EntryForm.css';

interface EntryFormProps {
  onSave: (text: string, latitude?: number, longitude?: number, authorId?: string, labelIds?: string[], selectedImages?: SelectedImage[]) => Promise<void>;
  onCancel: () => void;
  initialEntry?: Entry;
}

export function EntryForm({ onSave, onCancel, initialEntry }: EntryFormProps) {
  const [text, setText] = useState(initialEntry?.text || '');
  const [authorId, setAuthorId] = useState<string | undefined>(initialEntry?.authorId);
  const [labelIds, setLabelIds] = useState<string[]>(initialEntry?.labelIds || []);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialEntry;
  const existingImageCount = initialEntry?.imageIds.length || 0;

  const {
    coords,
    loading: locationLoading,
    error: locationError,
    fetchLocation,
    formatCoords,
  } = useLocation({ autoFetch: !isEditing }); // Only auto-fetch for new entries

  const validation = validateEntryText(text);
  const characterCount = text.length;
  const isValid = validation.isValid;

  // Use existing location when editing, or new location when creating
  const latitude = isEditing ? initialEntry.latitude : coords?.latitude;
  const longitude = isEditing ? initialEntry.longitude : coords?.longitude;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(text, latitude, longitude, authorId, labelIds, selectedImages);
      // Form will be closed by parent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      setSaving(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="entry-text" className="form-label">
          Quote Text <span className="required">*</span>
        </label>
        <textarea
          id="entry-text"
          className={`form-textarea ${!isValid && text ? 'invalid' : ''}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your quote, saying, or citation..."
          rows={6}
          autoFocus
        />
        <div className="form-meta">
          <span className={`char-count ${!isValid ? 'invalid' : ''}`}>
            {characterCount} / 10,000
          </span>
          {!isValid && text && (
            <span className="error-message">{validation.error}</span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Location</label>
        <div className="location-display">
          <svg
            className="location-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <div className="location-text">
            {isEditing ? (
              // Show existing location when editing
              latitude && longitude ? (
                <span className="location-coords">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              ) : (
                <span className="location-none">No location</span>
              )
            ) : (
              // Show live location fetch for new entries
              <>
                {locationLoading ? (
                  <span className="location-loading">Getting location...</span>
                ) : coords ? (
                  <span className="location-coords">{formatCoords()}</span>
                ) : locationError ? (
                  <span className="location-error">{locationError}</span>
                ) : (
                  <span className="location-none">No location</span>
                )}
              </>
            )}
          </div>
          {!isEditing && !coords && !locationLoading && (
            <button
              type="button"
              className="location-retry"
              onClick={fetchLocation}
            >
              Retry
            </button>
          )}
        </div>
        <p className="form-hint">
          {isEditing
            ? 'Location cannot be edited'
            : 'Location is optional. Grant permission to auto-capture.'}
        </p>
      </div>

      <AuthorSelect selectedAuthorId={authorId} onSelect={setAuthorId} />

      <LabelInput selectedLabelIds={labelIds} onLabelsChange={setLabelIds} />

      {!isEditing && (
        <ImageUpload
          onImagesSelected={setSelectedImages}
          maxImages={10}
          currentImageCount={existingImageCount}
        />
      )}

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
          {saving ? 'Saving...' : isEditing ? 'Update Quote' : 'Save Quote'}
        </button>
      </div>
    </form>
  );
}

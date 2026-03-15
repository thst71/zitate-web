/**
 * LabelInput Component - Input with autocomplete for labels
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLabels } from '../../hooks/useLabels';
import './LabelInput.css';

interface LabelInputProps {
  selectedLabelIds: string[];
  onLabelsChange: (labelIds: string[]) => void;
}

export const LabelInput: React.FC<LabelInputProps> = ({
  selectedLabelIds,
  onLabelsChange,
}) => {
  const { labels, addLabel, searchLabels, getLabelsByIds } = useLabels();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<typeof labels>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabels = getLabelsByIds(selectedLabelIds);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);

    if (value.trim()) {
      const matches = searchLabels(value);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    try {
      setError(null);
      const label = await addLabel(labelName.trim());

      // Add to selected labels if not already selected
      if (!selectedLabelIds.includes(label.id)) {
        onLabelsChange([...selectedLabelIds, label.id]);
      }

      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add label');
    }
  };

  const handleSuggestionClick = (labelId: string) => {
    // Add to selected if not already selected
    if (!selectedLabelIds.includes(labelId)) {
      onLabelsChange([...selectedLabelIds, labelId]);
    }

    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = inputValue.trim();
      if (value) {
        handleAddLabel(value);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleRemoveLabel = (labelId: string) => {
    onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="label-input-container">
      <label htmlFor="label-input" className="form-label">
        Labels (Optional)
      </label>

      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="selected-labels">
          {selectedLabels.map((label) => (
            <span key={label.id} className="label-tag">
              {label.name}
              <button
                type="button"
                className="label-remove"
                onClick={() => handleRemoveLabel(label.id)}
                aria-label={`Remove label ${label.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with autocomplete */}
      <div className="label-input-wrapper">
        <input
          ref={inputRef}
          id="label-input"
          type="text"
          className="form-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder="Type to search or create labels..."
          maxLength={50}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="label-suggestions">
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    className="label-suggestion"
                    onClick={() => handleSuggestionClick(label.id)}
                  >
                    {label.name}
                  </button>
                ))}
                {inputValue.trim() && !suggestions.some(s => s.name === inputValue.trim().toLowerCase()) && (
                  <button
                    type="button"
                    className="label-suggestion create"
                    onClick={() => handleAddLabel(inputValue)}
                  >
                    + Create "{inputValue.trim()}"
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="label-suggestion create"
                onClick={() => handleAddLabel(inputValue)}
              >
                + Create "{inputValue.trim()}"
              </button>
            )}
          </div>
        )}
      </div>

      {error && <span className="error-message">{error}</span>}

      <p className="form-hint">
        Press Enter to create or add a label. Labels are automatically lowercased.
      </p>
    </div>
  );
};

/**
 * LabelInput Component - Input with autocomplete for labels
 *
 * Supports keyboard navigation (Arrow keys, Tab, Enter, Escape),
 * mouse click, and touch tap for selecting from the suggestion list.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLabels } from '../../hooks/useLabels';
import type { Label } from '../../models';
import './LabelInput.css';

interface LabelInputProps {
  selectedLabelIds: string[];
  onLabelsChange: (labelIds: string[]) => void;
}

export const LabelInput: React.FC<LabelInputProps> = ({
  selectedLabelIds,
  onLabelsChange,
}) => {
  const { addLabel, searchLabels, getLabelsByIds } = useLabels();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Label[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setHighlightedIndex(-1);
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
      setHighlightedIndex(-1);
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
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  /** Whether the current input exactly matches an existing suggestion */
  const exactMatch = suggestions.some(
    (s) => s.name === inputValue.trim().toLowerCase()
  );

  /** Whether to show a "Create" option */
  const showCreateOption = inputValue.trim() && !exactMatch;

  /** Total items in the virtual list */
  const totalItems = suggestions.length + (showCreateOption ? 1 : 0);

  const handleSelectHighlighted = () => {
    if (highlightedIndex < 0 || highlightedIndex >= totalItems) return;

    if (highlightedIndex < suggestions.length) {
      handleSuggestionClick(suggestions[highlightedIndex].id);
    } else {
      // "Create" item
      handleAddLabel(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (inputValue.trim()) {
        const matches = searchLabels(inputValue);
        setSuggestions(matches);
        setShowSuggestions(true);
      }
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (totalItems > 0) {
          setHighlightedIndex((prev) => (prev + 1) % totalItems);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (totalItems > 0) {
          setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
        }
        break;
      case 'Tab':
        if (showSuggestions && highlightedIndex >= 0) {
          e.preventDefault();
          handleSelectHighlighted();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && highlightedIndex >= 0) {
          handleSelectHighlighted();
        } else {
          const value = inputValue.trim();
          if (value) {
            handleAddLabel(value);
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleRemoveLabel = (labelId: string) => {
    onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const listboxId = 'label-listbox';

  return (
    <div className="label-input-container" ref={containerRef}>
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
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `label-option-${highlightedIndex}` : undefined
          }
          aria-autocomplete="list"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && totalItems > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            className="label-suggestions"
            role="listbox"
            aria-label="Label suggestions"
          >
            {suggestions.map((label, index) => (
              <li
                key={label.id}
                id={`label-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`label-suggestion${highlightedIndex === index ? ' highlighted' : ''}${selectedLabelIds.includes(label.id) ? ' already-selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(label.id);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {label.name}
                {selectedLabelIds.includes(label.id) && (
                  <span className="label-check"> ✓</span>
                )}
              </li>
            ))}
            {showCreateOption && (
              <li
                id={`label-option-${suggestions.length}`}
                role="option"
                aria-selected={highlightedIndex === suggestions.length}
                className={`label-suggestion create${highlightedIndex === suggestions.length ? ' highlighted' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddLabel(inputValue);
                }}
                onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              >
                + Create "{inputValue.trim()}"
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <span className="error-message">{error}</span>}

      <p className="form-hint">
        Press Enter to create or add a label. Use ↑↓ to navigate suggestions, Tab or Enter to select.
      </p>
    </div>
  );
};

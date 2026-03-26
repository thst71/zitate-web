/**
 * AuthorSelect Component - Autocomplete combobox to select or create an author
 *
 * Supports keyboard navigation (Arrow keys, Tab, Enter, Escape),
 * mouse click, and touch tap for selecting from the suggestion list.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthors } from '../../hooks/useAuthors';
import type { Author } from '../../models';
import './AuthorSelect.css';

interface AuthorSelectProps {
  selectedAuthorId?: string;
  onSelect: (authorId: string | undefined) => void;
}

export const AuthorSelect: React.FC<AuthorSelectProps> = ({
  selectedAuthorId,
  onSelect,
}) => {
  const { loading, addAuthor, getAuthorById, searchAuthors } = useAuthors();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Author[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [createError, setCreateError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve selected author name for display
  const selectedAuthor = selectedAuthorId ? getAuthorById(selectedAuthorId) : undefined;

  // Sync input value with selected author when selection changes externally
  useEffect(() => {
    if (selectedAuthor) {
      setInputValue(selectedAuthor.name);
    } else if (!showSuggestions) {
      setInputValue('');
    }
  }, [selectedAuthor, showSuggestions]);

  // Build the suggestion list
  const updateSuggestions = useCallback(
    (query: string) => {
      const matches = searchAuthors(query);
      setSuggestions(matches);
      setHighlightedIndex(-1);
    },
    [searchAuthors]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setCreateError(null);
    updateSuggestions(value);
    setShowSuggestions(true);

    // If the user clears the field, unselect the author
    if (!value.trim()) {
      onSelect(undefined);
    }
  };

  const handleFocus = () => {
    updateSuggestions(inputValue);
    setShowSuggestions(true);
  };

  /** Whether the current input exactly matches an existing author */
  const exactMatch = suggestions.find(
    (a) => a.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  /** Total items: suggestions + optional "create" item */
  const showCreateOption = inputValue.trim() && !exactMatch;
  const totalItems = suggestions.length + (showCreateOption ? 1 : 0);

  // ---------- Selection helpers ----------

  const selectAuthor = (author: Author) => {
    onSelect(author.id);
    setInputValue(author.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleCreateAuthor = async () => {
    const name = inputValue.trim();
    if (!name) {
      setCreateError('Author name cannot be empty');
      return;
    }

    try {
      setCreateError(null);
      const author = await addAuthor(name);
      selectAuthor(author);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create author');
    }
  };

  const handleSelectHighlighted = () => {
    if (highlightedIndex < 0 || highlightedIndex >= totalItems) return;

    if (highlightedIndex < suggestions.length) {
      selectAuthor(suggestions[highlightedIndex]);
    } else {
      handleCreateAuthor();
    }
  };

  const handleClear = () => {
    onSelect(undefined);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // ---------- Keyboard navigation ----------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && e.key !== 'Escape') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        updateSuggestions(inputValue);
        setShowSuggestions(true);
        e.preventDefault();
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
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
        } else if (inputValue.trim()) {
          if (exactMatch) {
            selectAuthor(exactMatch);
          } else {
            handleCreateAuthor();
          }
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
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
        if (selectedAuthor) {
          setInputValue(selectedAuthor.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedAuthor]);

  const listboxId = 'author-listbox';

  return (
    <div className="author-select" ref={containerRef}>
      <label htmlFor="author-input" className="form-label">
        Author (Optional)
      </label>

      <div className="author-input-wrapper">
        <input
          ref={inputRef}
          id="author-input"
          type="text"
          className="form-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={loading ? 'Loading authors...' : 'Type to search or create author...'}
          disabled={loading}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `author-option-${highlightedIndex}` : undefined
          }
          aria-autocomplete="list"
          maxLength={200}
        />
        {selectedAuthorId && (
          <button
            type="button"
            className="author-clear"
            onClick={handleClear}
            aria-label="Clear author"
            title="Clear author"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && totalItems > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          className="author-suggestions"
          role="listbox"
          aria-label="Author suggestions"
        >
          {suggestions.map((author, index) => (
            <li
              key={author.id}
              id={`author-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              className={`author-suggestion${highlightedIndex === index ? ' highlighted' : ''}${author.id === selectedAuthorId ? ' selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectAuthor(author);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {author.name}
            </li>
          ))}
          {showCreateOption && (
            <li
              id={`author-option-${suggestions.length}`}
              role="option"
              aria-selected={highlightedIndex === suggestions.length}
              className={`author-suggestion create${highlightedIndex === suggestions.length ? ' highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateAuthor();
              }}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
            >
              + Create "{inputValue.trim()}"
            </li>
          )}
        </ul>
      )}

      {createError && <span className="error-message">{createError}</span>}
    </div>
  );
};

/**
 * SearchBar Component - Search input with debouncing
 */
import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search quotes, authors, labels...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const debouncedValue = useDebounce(inputValue, 300);

  // Trigger search when debounced value changes, but only after user interaction
  React.useEffect(() => {
    // Only call onSearch if user has interacted
    if (hasInteracted) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]); // Remove hasInteracted from dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleClear = () => {
    setInputValue('');
    // Keep hasInteracted true so the empty search is triggered
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-testid="search-icon"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="search"
          className="search-input"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label="Search"
        />
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * useSearch hook - Manages search functionality for entries
 */
import { useState, useCallback, useMemo } from 'react';
import type { Entry } from '../models';
import { useAuthors } from './useAuthors';
import { useLabels } from './useLabels';

export function useSearch(entries: Entry[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAuthorById } = useAuthors();
  const { getLabelsByIds } = useLabels();

  /**
   * Filter entries based on search query
   * Searches in: text, author name, label names
   */
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }

    const query = searchQuery.toLowerCase().trim();

    return entries.filter((entry) => {
      // Search in text
      if (entry.text.toLowerCase().includes(query)) {
        return true;
      }

      // Search in author name
      if (entry.authorId) {
        const author = getAuthorById(entry.authorId);
        if (author && author.name.toLowerCase().includes(query)) {
          return true;
        }
      }

      // Search in label names
      if (entry.labelIds.length > 0) {
        const labels = getLabelsByIds(entry.labelIds);
        if (labels.some((label) => label.name.toLowerCase().includes(query))) {
          return true;
        }
      }

      return false;
    });
  }, [entries, searchQuery, getAuthorById, getLabelsByIds]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    filteredEntries,
    handleSearch,
    clearSearch,
    isSearching: searchQuery.trim().length > 0,
  };
}

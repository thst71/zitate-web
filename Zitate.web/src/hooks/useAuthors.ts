/**
 * useAuthors hook - Manages author CRUD operations
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import type { Author } from '../models';
import { validateAuthorName } from '../utils/validators';

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all authors from IndexedDB
   */
  const loadAuthors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allAuthors = await dbService.getAll<Author>(STORES.AUTHORS);
      // Sort by name
      allAuthors.sort((a, b) => a.name.localeCompare(b.name));
      setAuthors(allAuthors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new author
   */
  const addAuthor = useCallback(
    async (name: string): Promise<Author> => {
      // Validate name
      const validation = validateAuthorName(name);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for duplicates (case-insensitive)
      const normalizedName = name.trim();
      const duplicate = authors.find(
        (a) => a.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        throw new Error('An author with this name already exists');
      }

      const now = Date.now();
      const author: Author = {
        id: uuidv4(),
        name: normalizedName,
        createdAt: now,
      };

      try {
        await dbService.add(STORES.AUTHORS, author);
        setAuthors((prev) => [...prev, author].sort((a, b) => a.name.localeCompare(b.name)));
        return author;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save author'
        );
      }
    },
    [authors]
  );

  /**
   * Update an existing author
   */
  const updateAuthor = useCallback(
    async (id: string, name: string): Promise<void> => {
      // Validate name
      const validation = validateAuthorName(name);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for duplicates (case-insensitive), excluding current author
      const normalizedName = name.trim();
      const duplicate = authors.find(
        (a) => a.id !== id && a.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        throw new Error('An author with this name already exists');
      }

      const author = authors.find((a) => a.id === id);
      if (!author) {
        throw new Error('Author not found');
      }

      const updated: Author = {
        ...author,
        name: normalizedName,
      };

      try {
        await dbService.update(STORES.AUTHORS, updated);
        setAuthors((prev) =>
          prev.map((a) => (a.id === id ? updated : a)).sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update author'
        );
      }
    },
    [authors]
  );

  /**
   * Delete an author
   */
  const deleteAuthor = useCallback(async (id: string): Promise<void> => {
    try {
      await dbService.delete(STORES.AUTHORS, id);
      setAuthors((prev) => prev.filter((author) => author.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete author'
      );
    }
  }, []);

  /**
   * Get author by ID
   */
  const getAuthorById = useCallback(
    (id: string): Author | undefined => {
      return authors.find((a) => a.id === id);
    },
    [authors]
  );

  // Load authors on mount
  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  return {
    authors,
    loading,
    error,
    addAuthor,
    updateAuthor,
    deleteAuthor,
    getAuthorById,
    reload: loadAuthors,
  };
}

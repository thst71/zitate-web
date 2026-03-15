/**
 * useEntries hook - Manages entry CRUD operations
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import type { Entry } from '../models';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all entries from IndexedDB
   */
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allEntries = await dbService.getAllEntriesSorted<Entry>();
      setEntries(allEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new entry
   */
  const addEntry = useCallback(
    async (
      text: string,
      latitude?: number,
      longitude?: number,
      authorId?: string,
      labelIds: string[] = []
    ): Promise<Entry> => {
      const now = Date.now();
      const entry: Entry = {
        id: uuidv4(),
        text,
        latitude,
        longitude,
        authorId,
        labelIds,
        imageIds: [],
        createdAt: now,
        updatedAt: now,
      };

      try {
        await dbService.add(STORES.ENTRIES, entry);
        setEntries((prev) => [entry, ...prev]); // Add to beginning (newest first)
        return entry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save entry'
        );
      }
    },
    []
  );

  /**
   * Delete an entry
   */
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      await dbService.delete(STORES.ENTRIES, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete entry'
      );
    }
  }, []);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    error,
    addEntry,
    deleteEntry,
    reload: loadEntries,
  };
}

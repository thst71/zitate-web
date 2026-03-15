/**
 * useFolders hook - Manages smart folder CRUD and filtering
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import type { SmartFolder, Entry } from '../models';
import { validateFolderName } from '../utils/validators';
import { useAuthors } from './useAuthors';
import { useLabels } from './useLabels';

export function useFolders() {
  const [folders, setFolders] = useState<SmartFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthorById } = useAuthors();
  const { getLabelsByIds } = useLabels();

  /**
   * Load all folders from IndexedDB
   */
  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allFolders = await dbService.getAll<SmartFolder>(STORES.FOLDERS);
      // Sort by name
      allFolders.sort((a, b) => a.name.localeCompare(b.name));
      setFolders(allFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new folder
   */
  const addFolder = useCallback(
    async (name: string, criteria: SmartFolder['criteria']): Promise<SmartFolder> => {
      // Validate name
      const validation = validateFolderName(name);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for duplicates (case-insensitive)
      const normalizedName = name.trim();
      const duplicate = folders.find(
        (f) => f.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        throw new Error('A folder with this name already exists');
      }

      const now = Date.now();
      const folder: SmartFolder = {
        id: uuidv4(),
        name: normalizedName,
        criteria,
        createdAt: now,
      };

      try {
        await dbService.add(STORES.FOLDERS, folder);
        setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        return folder;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save folder'
        );
      }
    },
    [folders]
  );

  /**
   * Update an existing folder
   */
  const updateFolder = useCallback(
    async (id: string, name: string, criteria: SmartFolder['criteria']): Promise<void> => {
      // Validate name
      const validation = validateFolderName(name);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for duplicates (case-insensitive), excluding current folder
      const normalizedName = name.trim();
      const duplicate = folders.find(
        (f) => f.id !== id && f.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        throw new Error('A folder with this name already exists');
      }

      const folder = folders.find((f) => f.id === id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const updated: SmartFolder = {
        ...folder,
        name: normalizedName,
        criteria,
      };

      try {
        await dbService.update(STORES.FOLDERS, updated);
        setFolders((prev) =>
          prev.map((f) => (f.id === id ? updated : f)).sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update folder'
        );
      }
    },
    [folders]
  );

  /**
   * Delete a folder
   */
  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    try {
      await dbService.delete(STORES.FOLDERS, id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete folder'
      );
    }
  }, []);

  /**
   * Filter entries by folder criteria
   */
  const filterByFolder = useCallback(
    (entries: Entry[], folder: SmartFolder): Entry[] => {
      return entries.filter((entry) => {
        const criteria = folder.criteria;

        // Filter by labels
        if (criteria.labelIds && criteria.labelIds.length > 0) {
          const hasMatchingLabel = criteria.labelIds.some((labelId) =>
            entry.labelIds.includes(labelId)
          );
          if (!hasMatchingLabel) return false;
        }

        // Filter by author
        if (criteria.authorId) {
          if (entry.authorId !== criteria.authorId) return false;
        }

        // Filter by date range
        if (criteria.dateFrom) {
          if (entry.createdAt < criteria.dateFrom) return false;
        }
        if (criteria.dateTo) {
          if (entry.createdAt > criteria.dateTo) return false;
        }

        // Filter by location (has location)
        if (criteria.hasLocation !== undefined) {
          const entryHasLocation = entry.latitude !== undefined && entry.longitude !== undefined;
          if (criteria.hasLocation !== entryHasLocation) return false;
        }

        // Filter by text (case-insensitive partial match)
        if (criteria.textContains) {
          const query = criteria.textContains.toLowerCase();
          if (!entry.text.toLowerCase().includes(query)) return false;
        }

        return true;
      });
    },
    []
  );

  /**
   * Get entry count for a folder
   */
  const getFolderCount = useCallback(
    (entries: Entry[], folder: SmartFolder): number => {
      return filterByFolder(entries, folder).length;
    },
    [filterByFolder]
  );

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    loading,
    error,
    addFolder,
    updateFolder,
    deleteFolder,
    filterByFolder,
    getFolderCount,
    reload: loadFolders,
  };
}

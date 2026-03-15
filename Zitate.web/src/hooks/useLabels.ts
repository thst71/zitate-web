/**
 * useLabels hook - Manages label CRUD operations
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import type { Label } from '../models';
import { validateLabelName, normalizeLabelName } from '../utils/validators';

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all labels from IndexedDB
   */
  const loadLabels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allLabels = await dbService.getAll<Label>(STORES.LABELS);
      // Sort by name
      allLabels.sort((a, b) => a.name.localeCompare(b.name));
      setLabels(allLabels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new label or return existing
   */
  const addLabel = useCallback(
    async (name: string): Promise<Label> => {
      // Validate name
      const validation = validateLabelName(name);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Normalize (lowercase)
      const normalizedName = normalizeLabelName(name);

      // Check if label already exists
      const existing = labels.find((l) => l.name === normalizedName);
      if (existing) {
        return existing; // Return existing label
      }

      const label: Label = {
        id: uuidv4(),
        name: normalizedName,
      };

      try {
        await dbService.add(STORES.LABELS, label);
        setLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
        return label;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save label'
        );
      }
    },
    [labels]
  );

  /**
   * Delete a label
   */
  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    try {
      await dbService.delete(STORES.LABELS, id);
      setLabels((prev) => prev.filter((label) => label.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete label'
      );
    }
  }, []);

  /**
   * Get labels by IDs
   */
  const getLabelsByIds = useCallback(
    (ids: string[]): Label[] => {
      return labels.filter((l) => ids.includes(l.id));
    },
    [labels]
  );

  /**
   * Search labels by prefix
   */
  const searchLabels = useCallback(
    (query: string): Label[] => {
      if (!query.trim()) {
        return labels.slice(0, 10); // Return first 10 if empty query
      }

      const normalizedQuery = query.toLowerCase().trim();
      return labels
        .filter((l) => l.name.startsWith(normalizedQuery))
        .slice(0, 10); // Return top 10 matches
    },
    [labels]
  );

  // Load labels on mount
  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  return {
    labels,
    loading,
    error,
    addLabel,
    deleteLabel,
    getLabelsByIds,
    searchLabels,
    reload: loadLabels,
  };
}

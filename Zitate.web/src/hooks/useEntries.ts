/**
 * useEntries hook - Manages entry CRUD operations and image attachments
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import { compressImage } from '../services/image.service';
import type { Entry, ImageAttachment } from '../models';
import type { SelectedImage } from '../components/image/ImageUpload';

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
   * Save images to IndexedDB
   */
  const saveImages = useCallback(
    async (entryId: string, selectedImages: SelectedImage[]): Promise<string[]> => {
      const imageIds: string[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const selectedImage = selectedImages[i];

        try {
          // Compress the image
          const compressedBlob = await compressImage(selectedImage.file);

          // Create ImageAttachment
          const imageAttachment: ImageAttachment = {
            id: uuidv4(),
            entryId,
            blob: compressedBlob,
            mimeType: selectedImage.file.type,
            size: compressedBlob.size,
            order: i,
            createdAt: Date.now(),
          };

          // Save to IndexedDB
          await dbService.add(STORES.IMAGES, imageAttachment);
          imageIds.push(imageAttachment.id);
        } catch (err) {
          console.error(`Failed to save image ${selectedImage.file.name}:`, err);
        }
      }

      return imageIds;
    },
    []
  );

  /**
   * Get images for an entry
   */
  const getImagesForEntry = useCallback(
    async (entryId: string): Promise<ImageAttachment[]> => {
      try {
        const images = await dbService.query<ImageAttachment>(
          STORES.IMAGES,
          'entryId',
          entryId
        );
        // Sort by order
        return images.sort((a, b) => a.order - b.order);
      } catch (err) {
        console.error('Failed to load images:', err);
        return [];
      }
    },
    []
  );

  /**
   * Delete an image
   */
  const deleteImage = useCallback(
    async (imageId: string): Promise<void> => {
      try {
        await dbService.delete(STORES.IMAGES, imageId);
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to delete image'
        );
      }
    },
    []
  );

  /**
   * Add a new entry
   */
  const addEntry = useCallback(
    async (
      text: string,
      latitude?: number,
      longitude?: number,
      authorId?: string,
      labelIds: string[] = [],
      selectedImages: SelectedImage[] = []
    ): Promise<Entry> => {
      const now = Date.now();
      const entryId = uuidv4();

      // Save images first
      const imageIds = await saveImages(entryId, selectedImages);

      const entry: Entry = {
        id: entryId,
        text,
        latitude,
        longitude,
        authorId,
        labelIds,
        imageIds,
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
    [saveImages]
  );

  /**
   * Update an existing entry
   */
  const updateEntry = useCallback(
    async (
      id: string,
      text: string,
      authorId?: string,
      labelIds: string[] = []
    ): Promise<Entry> => {
      // Find the existing entry
      const existingEntry = entries.find((e) => e.id === id);
      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      const updatedEntry: Entry = {
        ...existingEntry,
        text,
        authorId,
        labelIds,
        updatedAt: Date.now(),
      };

      try {
        await dbService.update(STORES.ENTRIES, updatedEntry);
        setEntries((prev) =>
          prev.map((entry) => (entry.id === id ? updatedEntry : entry))
        );
        return updatedEntry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update entry'
        );
      }
    },
    [entries]
  );

  /**
   * Delete an entry and its associated images
   */
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      // Get entry to find associated images
      const entry = entries.find((e) => e.id === id);

      // Delete associated images
      if (entry && entry.imageIds.length > 0) {
        for (const imageId of entry.imageIds) {
          try {
            await dbService.delete(STORES.IMAGES, imageId);
          } catch (err) {
            console.error(`Failed to delete image ${imageId}:`, err);
          }
        }
      }

      // Delete entry
      await dbService.delete(STORES.ENTRIES, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete entry'
      );
    }
  }, [entries]);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    getImagesForEntry,
    deleteImage,
    reload: loadEntries,
  };
}

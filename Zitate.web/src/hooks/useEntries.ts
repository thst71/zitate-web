/**
 * useEntries hook - Manages entry CRUD operations and image attachments
 */
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dbService, STORES } from '../services/db.service';
import { onStoreChange, emitStoreChange } from '../services/storeSync';
import { compressImage } from '../services/image.service';
import type { Entry, ImageAttachment } from '../models';
import type { SelectedImage } from '../components/image/ImageUpload';

const ENTRY_STORE = STORES.ENTRIES;

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
        emitStoreChange(ENTRY_STORE, loadEntries);
        return entry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save entry'
        );
      }
    },
    [saveImages, loadEntries]
  );

  /**
   * Update an existing entry (including image changes)
   */
  const updateEntry = useCallback(
    async (
      id: string,
      text: string,
      authorId?: string,
      labelIds: string[] = [],
      latitude?: number,
      longitude?: number,
      imagesToAdd: SelectedImage[] = [],
      imagesToDelete: string[] = [],
      imageIdsOrder?: string[],
      imageReplacements: Map<string, SelectedImage> = new Map()
    ): Promise<Entry> => {
      // Find the existing entry
      const existingEntry = entries.find((e) => e.id === id);
      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      let updatedImageIds = imageIdsOrder
        ? [...imageIdsOrder]
        : [...existingEntry.imageIds];

      // 1. Handle replacements: delete old image, save new one, swap ID
      for (const [oldId, selectedImage] of imageReplacements.entries()) {
        try {
          // Delete old image from IndexedDB
          await dbService.delete(STORES.IMAGES, oldId);

          // Save new image
          const newIds = await saveImages(id, [selectedImage]);
          if (newIds.length > 0) {
            const idx = updatedImageIds.indexOf(oldId);
            if (idx !== -1) {
              updatedImageIds[idx] = newIds[0];
            }
          }
        } catch (err) {
          console.error(`Failed to replace image ${oldId}:`, err);
        }
      }

      // 2. Handle deletions
      for (const imageId of imagesToDelete) {
        try {
          await dbService.delete(STORES.IMAGES, imageId);
        } catch (err) {
          console.error(`Failed to delete image ${imageId}:`, err);
        }
      }
      updatedImageIds = updatedImageIds.filter(
        (imgId) => !imagesToDelete.includes(imgId)
      );

      // 3. Handle additions
      if (imagesToAdd.length > 0) {
        const newIds = await saveImages(id, imagesToAdd);
        updatedImageIds = [...updatedImageIds, ...newIds];
      }

      // 4. Update order field on all remaining images
      for (let i = 0; i < updatedImageIds.length; i++) {
        try {
          const img = await dbService.get<ImageAttachment>(STORES.IMAGES, updatedImageIds[i]);
          if (img && img.order !== i) {
            await dbService.update(STORES.IMAGES, { ...img, order: i });
          }
        } catch (err) {
          console.error(`Failed to update image order for ${updatedImageIds[i]}:`, err);
        }
      }

      const updatedEntry: Entry = {
        ...existingEntry,
        text,
        authorId,
        labelIds,
        latitude,
        longitude,
        imageIds: updatedImageIds,
        updatedAt: Date.now(),
      };

      try {
        await dbService.update(STORES.ENTRIES, updatedEntry);
        setEntries((prev) =>
          prev.map((entry) => (entry.id === id ? updatedEntry : entry))
        );
        emitStoreChange(ENTRY_STORE, loadEntries);
        return updatedEntry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update entry'
        );
      }
    },
    [entries, saveImages, loadEntries]
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
      emitStoreChange(ENTRY_STORE, loadEntries);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete entry'
      );
    }
  }, [entries, loadEntries]);

  // Load entries on mount and subscribe to changes from other hook instances
  useEffect(() => {
    loadEntries();
    return onStoreChange(ENTRY_STORE, loadEntries);
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

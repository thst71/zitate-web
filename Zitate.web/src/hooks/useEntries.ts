/**
 * useEntries hook - Manages entry CRUD operations and image attachments.
 *
 * Since schema v3, images are stored as PouchDB attachments on the entry
 * document. Metadata (mimeType, size, order, createdAt) is kept in the
 * `imageAttachments` array on the Entry model.
 */
import {useCallback, useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';
import {dbService, STORES} from '../services/db.service';
import {emitStoreChange, onStoreChange} from '../services/storeSync';
import {compressImage} from '../services/image.service';
import {locationService} from '../services/location.service';
import type {Entry, EntryLink, ImageAttachmentMeta, ImageAttachmentWithBlob} from '../models';
import type {SelectedImage} from '../components/image/ImageUpload';

const ENTRY_STORE = STORES.ENTRIES;

export function useEntries() {
  const normalizeEntry = useCallback(
    (entry: Entry): Entry => ({
      ...entry,
      labelIds: entry.labelIds ?? [],
      links: entry.links ?? [],
      imageAttachments: entry.imageAttachments ?? [],
    }),
    []
  );

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all entries from PouchDB
   */
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allEntries = await dbService.getAllEntriesSorted<Entry>();
      setEntries(allEntries.map(normalizeEntry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [normalizeEntry]);

  /**
   * Save images as PouchDB attachments on the entry document.
   * Returns the metadata array for the saved images.
   */
  const saveImages = useCallback(
    async (entryId: string, selectedImages: SelectedImage[], startOrder: number = 0): Promise<ImageAttachmentMeta[]> => {
      const metas: ImageAttachmentMeta[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const selectedImage = selectedImages[i];

        try {
          const compressedBlob = await compressImage(selectedImage.file);
          const imageId = uuidv4();
          const attachmentName = `image-${imageId}`;

          await dbService.putAttachment(
            STORES.ENTRIES, entryId, attachmentName,
            compressedBlob, selectedImage.file.type
          );

          metas.push({
            id: imageId,
            mimeType: selectedImage.file.type,
            size: compressedBlob.size,
            order: startOrder + i,
            createdAt: Date.now(),
          });
        } catch (err) {
          // Log but don't fail the whole operation
          void err;
        }
      }

      return metas;
    },
    []
  );

  /**
   * Get images for an entry by loading PouchDB attachments.
   */
  const getImagesForEntry = useCallback(
    async (entryId: string): Promise<ImageAttachmentWithBlob[]> => {
      try {
        const entry = await dbService.get<Entry>(STORES.ENTRIES, entryId);
        if (!entry || !entry.imageAttachments || entry.imageAttachments.length === 0) {
          return [];
        }

        const images: ImageAttachmentWithBlob[] = [];
        for (const meta of entry.imageAttachments) {
          try {
            const blob = await dbService.getAttachment(
              STORES.ENTRIES, entryId, `image-${meta.id}`
            );
            images.push({ ...meta, blob });
          } catch {
            // Attachment missing — skip
          }
        }

        return images.sort((a, b) => a.order - b.order);
      } catch {
        return [];
      }
    },
    []
  );

  /**
   * Delete an image attachment from an entry.
   */
  const deleteImage = useCallback(
    async (entryId: string, imageId: string): Promise<void> => {
      try {
        await dbService.removeAttachment(STORES.ENTRIES, entryId, `image-${imageId}`);
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to delete image'
        );
      }
    },
    []
  );

  /**
   * Reverse-geocode coordinates and persist address fields on the entry.
   */
  const geocodeAndPersist = useCallback(
    async (entry: Entry) => {
      if (entry.latitude == null || entry.longitude == null) return;
      try {
        const result = await locationService.reverseGeocode(entry.latitude, entry.longitude);
        if (result) {
          const updated: Entry = {
            ...entry,
            addressShort: result.short,
            addressFull: result.full,
          };
          await dbService.update(STORES.ENTRIES, updated);
          setEntries((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
          emitStoreChange(ENTRY_STORE, loadEntries);
        }
      } catch (err) {
        void err;
      }
    },
    [loadEntries]
  );

  /**
   * Add a new entry
   */
  const addEntry = useCallback(
    async (
      text: string,
      citationDate: number,
      latitude?: number,
      longitude?: number,
      authorId?: string,
      labelIds: string[] = [],
      selectedImages: SelectedImage[] = [],
      addressShort?: string,
      addressFull?: string,
      links: EntryLink[] = []
    ): Promise<Entry> => {
      const now = Date.now();
      const entryId = uuidv4();

      // Create entry first (without images) so the document exists for attachments
      const entry: Entry = {
        id: entryId,
        text,
        citationDate,
        latitude,
        longitude,
        addressShort,
        addressFull,
        authorId,
        labelIds,
        links,
        imageAttachments: [],
        createdAt: now,
        updatedAt: now,
      };

      try {
        await dbService.add(STORES.ENTRIES, entry);

        // Save images as attachments
        if (selectedImages.length > 0) {
          entry.imageAttachments = await saveImages(entryId, selectedImages);
          await dbService.update(STORES.ENTRIES, entry);
        }

        setEntries((prev) => [normalizeEntry(entry), ...prev]);
        emitStoreChange(ENTRY_STORE, loadEntries);

        // Background geocoding if address not already provided
        if (latitude != null && longitude != null && !addressShort) {
          geocodeAndPersist(entry);
        }

        return entry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to save entry'
        );
      }
    },
    [saveImages, loadEntries, geocodeAndPersist, normalizeEntry]
  );

  /**
   * Update an existing entry (including image changes)
   */
  const updateEntry = useCallback(
    async (
      id: string,
      text: string,
      citationDate: number,
      authorId?: string,
      labelIds: string[] = [],
      latitude?: number,
      longitude?: number,
      imagesToAdd: SelectedImage[] = [],
      imagesToDelete: string[] = [],
      imageIdsOrder?: string[],
      imageReplacements: Map<string, SelectedImage> = new Map(),
      addressShort?: string,
      addressFull?: string,
      links?: EntryLink[]
    ): Promise<Entry> => {
      const existingEntry = entries.find((e) => e.id === id);
      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      const locationChanged =
        latitude !== existingEntry.latitude ||
        longitude !== existingEntry.longitude;

      let updatedAttachments = imageIdsOrder
        ? imageIdsOrder.map((imgId) =>
            existingEntry.imageAttachments.find((m) => m.id === imgId)
          ).filter((m): m is ImageAttachmentMeta => m !== undefined)
        : [...existingEntry.imageAttachments];

      // 1. Handle replacements
      for (const [oldId, selectedImage] of imageReplacements.entries()) {
        try {
          await dbService.removeAttachment(STORES.ENTRIES, id, `image-${oldId}`);
          const newMetas = await saveImages(id, [selectedImage]);
          if (newMetas.length > 0) {
            const idx = updatedAttachments.findIndex((m) => m.id === oldId);
            if (idx !== -1) {
              updatedAttachments[idx] = { ...newMetas[0], order: updatedAttachments[idx].order };
            }
          }
        } catch {
          // Skip failed replacement
        }
      }

      // 2. Handle deletions
      for (const imageId of imagesToDelete) {
        try {
          await dbService.removeAttachment(STORES.ENTRIES, id, `image-${imageId}`);
        } catch {
          // Already removed
        }
      }
      updatedAttachments = updatedAttachments.filter(
        (m) => !imagesToDelete.includes(m.id)
      );

      // 3. Handle additions
      if (imagesToAdd.length > 0) {
        const newMetas = await saveImages(id, imagesToAdd, updatedAttachments.length);
        updatedAttachments = [...updatedAttachments, ...newMetas];
      }

      // 4. Update order fields
      updatedAttachments = updatedAttachments.map((m, i) => ({
        ...m,
        order: i,
      }));

      const updatedEntry: Entry = {
        ...existingEntry,
        text,
        citationDate,
        authorId,
        labelIds,
        links: links ?? existingEntry.links ?? [],
        latitude,
        longitude,
        addressShort: addressShort ?? (locationChanged ? undefined : existingEntry.addressShort),
        addressFull: addressFull ?? (locationChanged ? undefined : existingEntry.addressFull),
        imageAttachments: updatedAttachments,
        updatedAt: Date.now(),
      };

      try {
        await dbService.update(STORES.ENTRIES, updatedEntry);
        setEntries((prev) =>
          prev.map((entry) => (entry.id === id ? normalizeEntry(updatedEntry) : entry))
        );
        emitStoreChange(ENTRY_STORE, loadEntries);

        if (locationChanged && latitude != null && longitude != null && !addressShort) {
          geocodeAndPersist(updatedEntry);
        }

        return updatedEntry;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update entry'
        );
      }
    },
    [entries, saveImages, loadEntries, geocodeAndPersist, normalizeEntry]
  );

  /**
   * Delete an entry (PouchDB automatically removes all attachments with the document)
   */
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      await dbService.delete(STORES.ENTRIES, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      emitStoreChange(ENTRY_STORE, loadEntries);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete entry'
      );
    }
  }, [loadEntries]);

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

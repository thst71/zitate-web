import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntries } from './useEntries';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

// Mock fetch to prevent background geocoding from causing side effects in tests
globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

describe('useEntries', () => {
  beforeEach(async () => {
    // Clear entries before each test
    const allEntries = await dbService.getAll(STORES.ENTRIES);
    for (const item of allEntries) {
      await dbService.delete(STORES.ENTRIES, (item as { id: string }).id);
    }
    // Clear images before each test
    const allImages = await dbService.getAll(STORES.IMAGES);
    for (const item of allImages) {
      await dbService.delete(STORES.IMAGES, (item as { id: string }).id);
    }
  });

  it('should initialize with empty entries array', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load existing entries', async () => {
    // Add test entries
    const testEntries = [
      {
        id: 'entry-1',
        text: 'Test entry 1',
        labelIds: [],
        imageIds: [],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
      {
        id: 'entry-2',
        text: 'Test entry 2',
        labelIds: [],
        imageIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const entry of testEntries) {
      await dbService.add(STORES.ENTRIES, entry);
    }

    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].text).toBe('Test entry 2'); // Newest first
    expect(result.current.entries[1].text).toBe('Test entry 1');
  });

  it('should add a new entry without location', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('New entry text');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('New entry text');
    expect(result.current.entries[0].latitude).toBeUndefined();
    expect(result.current.entries[0].longitude).toBeUndefined();
  });

  it('should add a new entry with location', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry with location', 52.52, 13.405);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('Entry with location');
    expect(result.current.entries[0].latitude).toBe(52.52);
    expect(result.current.entries[0].longitude).toBe(13.405);
  });

  it('should delete an entry', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry to delete');
    });

    const entryId = result.current.entries[0].id;

    await act(async () => {
      await result.current.deleteEntry(entryId);
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it('should allow adding entry with any text (validation happens at form level)', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook allows any text - validation is done at form level
    await act(async () => {
      await result.current.addEntry('Valid text');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('Valid text');
  });

  it('should reload entries', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add entry directly to DB (bypassing hook)
    await dbService.add(STORES.ENTRIES, {
      id: 'external-entry',
      text: 'External entry',
      labelIds: [],
      imageIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Reload should pick up the new entry
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('External entry');
  });

  it('should maintain sort order (newest first)', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('First entry');
    });

    await act(async () => {
      await result.current.addEntry('Second entry');
    });

    await act(async () => {
      await result.current.addEntry('Third entry');
    });

    expect(result.current.entries).toHaveLength(3);
    expect(result.current.entries[0].text).toBe('Third entry');
    expect(result.current.entries[1].text).toBe('Second entry');
    expect(result.current.entries[2].text).toBe('First entry');
  });

  it('should handle partial location data correctly', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add with only latitude (should treat as no location)
    await act(async () => {
      await result.current.addEntry('Entry', 52.52, undefined);
    });

    const entry = result.current.entries[0];
    expect(entry.latitude).toBe(52.52);
    expect(entry.longitude).toBeUndefined();
  });

  describe('updateEntry', () => {
    it('should update text and metadata', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addEntry('Original text', 52.52, 13.405, 'author-1', ['label-1']);
      });

      const entryId = result.current.entries[0].id;

      await act(async () => {
        await result.current.updateEntry(entryId, 'Updated text', 'author-2', ['label-2'], 48.85, 2.35);
      });

      const updated = result.current.entries[0];
      expect(updated.text).toBe('Updated text');
      expect(updated.authorId).toBe('author-2');
      expect(updated.labelIds).toEqual(['label-2']);
      expect(updated.latitude).toBe(48.85);
      expect(updated.longitude).toBe(2.35);
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    it('should throw when updating non-existent entry', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateEntry('non-existent-id', 'text');
        })
      ).rejects.toThrow('Entry not found');
    });

    it('should delete images from entry on update', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add an entry with manually created image records
      const entryId = 'entry-with-images';
      const imageId1 = 'img-1';
      const imageId2 = 'img-2';

      // Store image records
      await dbService.add(STORES.IMAGES, {
        id: imageId1,
        entryId,
        blob: new Blob(['data1']),
        mimeType: 'image/png',
        size: 100,
        order: 0,
        createdAt: Date.now(),
      });
      await dbService.add(STORES.IMAGES, {
        id: imageId2,
        entryId,
        blob: new Blob(['data2']),
        mimeType: 'image/png',
        size: 100,
        order: 1,
        createdAt: Date.now(),
      });

      // Store entry
      const now = Date.now();
      await dbService.add(STORES.ENTRIES, {
        id: entryId,
        text: 'Entry with images',
        labelIds: [],
        imageIds: [imageId1, imageId2],
        createdAt: now,
        updatedAt: now,
      });

      // Reload to pick up the entry
      await act(async () => {
        await result.current.reload();
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].imageIds).toEqual([imageId1, imageId2]);

      // Delete img-1 via updateEntry
      await act(async () => {
        await result.current.updateEntry(
          entryId, 'Entry with images', undefined, [],
          undefined, undefined,
          [], // imagesToAdd
          [imageId1], // imagesToDelete
        );
      });

      const updated = result.current.entries[0];
      expect(updated.imageIds).toEqual([imageId2]);

      // Verify img-1 is deleted from IndexedDB
      const deletedImage = await dbService.get(STORES.IMAGES, imageId1);
      expect(deletedImage).toBeUndefined();

      // Verify img-2 still exists
      const remainingImage = await dbService.get(STORES.IMAGES, imageId2);
      expect(remainingImage).toBeDefined();
    });

    it('should reorder images on update', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const entryId = 'entry-reorder';
      const now = Date.now();

      // Create images
      for (let i = 0; i < 3; i++) {
        await dbService.add(STORES.IMAGES, {
          id: `img-${i}`,
          entryId,
          blob: new Blob([`data-${i}`]),
          mimeType: 'image/png',
          size: 100,
          order: i,
          createdAt: now,
        });
      }

      await dbService.add(STORES.ENTRIES, {
        id: entryId,
        text: 'Reorder test',
        labelIds: [],
        imageIds: ['img-0', 'img-1', 'img-2'],
        createdAt: now,
        updatedAt: now,
      });

      await act(async () => {
        await result.current.reload();
      });

      // Reorder: move img-2 to front
      await act(async () => {
        await result.current.updateEntry(
          entryId, 'Reorder test', undefined, [],
          undefined, undefined,
          [], // imagesToAdd
          [], // imagesToDelete
          ['img-2', 'img-0', 'img-1'], // imageIdsOrder
        );
      });

      const updated = result.current.entries[0];
      expect(updated.imageIds).toEqual(['img-2', 'img-0', 'img-1']);

      // Verify order fields updated in IndexedDB
      const img2 = await dbService.get<{ order: number }>(STORES.IMAGES, 'img-2');
      const img0 = await dbService.get<{ order: number }>(STORES.IMAGES, 'img-0');
      const img1 = await dbService.get<{ order: number }>(STORES.IMAGES, 'img-1');
      expect(img2?.order).toBe(0);
      expect(img0?.order).toBe(1);
      expect(img1?.order).toBe(2);
    });

    it('should preserve imageIds when no image changes provided', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const entryId = 'entry-preserve';
      const now = Date.now();

      await dbService.add(STORES.ENTRIES, {
        id: entryId,
        text: 'Preserve images',
        labelIds: [],
        imageIds: ['img-a', 'img-b'],
        createdAt: now,
        updatedAt: now,
      });

      await act(async () => {
        await result.current.reload();
      });

      // Update text only, no image changes
      await act(async () => {
        await result.current.updateEntry(entryId, 'Updated text');
      });

      const updated = result.current.entries[0];
      expect(updated.text).toBe('Updated text');
      expect(updated.imageIds).toEqual(['img-a', 'img-b']);
    });
  });
});

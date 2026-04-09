import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntries } from './useEntries';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

// Mock fetch to prevent background geocoding from causing side effects in tests
globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

describe('useEntries', () => {
  beforeEach(async () => {
    await dbService.clear(STORES.ENTRIES);
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
        imageAttachments: [],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
      {
        id: 'entry-2',
        text: 'Test entry 2',
        labelIds: [],
        imageAttachments: [],
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
      await result.current.addEntry('New entry text', Date.now());
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
      await result.current.addEntry('Entry with location', Date.now(), 52.52, 13.405);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('Entry with location');
    expect(result.current.entries[0].latitude).toBe(52.52);
    expect(result.current.entries[0].longitude).toBe(13.405);
  });

  it('should add a new entry with attached links', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const links = [{ id: 'link-1', url: 'https://example.com', addedAt: Date.now() }];

    await act(async () => {
      await result.current.addEntry('Entry with link', Date.now(), undefined, undefined, undefined, [], [], undefined, undefined, links);
    });

    expect(result.current.entries[0].links).toEqual(links);
  });

  it('should add a new entry with a specific citation date', async () => {
    const { result } = renderHook(() => useEntries());
    const citationDate = new Date('2023-05-10').getTime();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry with citation date', citationDate);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].citationDate).toBe(citationDate);
  });

  it('should delete an entry', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry to delete', Date.now());
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

    await act(async () => {
      await result.current.addEntry('Valid text', Date.now());
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
      imageAttachments: [],
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
      await result.current.addEntry('First entry', Date.now());
    });

    await act(async () => {
      await result.current.addEntry('Second entry', Date.now());
    });

    await act(async () => {
      await result.current.addEntry('Third entry', Date.now());
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

    await act(async () => {
      await result.current.addEntry('Entry', Date.now(), 52.52, undefined);
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
        await result.current.addEntry('Original text', Date.now(), 52.52, 13.405, 'author-1', ['label-1']);
      });

      const entryId = result.current.entries[0].id;

      await act(async () => {
        await result.current.updateEntry(entryId, 'Updated text', Date.now(), 'author-2', ['label-2'], 48.85, 2.35);
      });

      const updated = result.current.entries[0];
      expect(updated.text).toBe('Updated text');
      expect(updated.authorId).toBe('author-2');
      expect(updated.labelIds).toEqual(['label-2']);
      expect(updated.latitude).toBe(48.85);
      expect(updated.longitude).toBe(2.35);
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    it('should update the citation date', async () => {
      const { result } = renderHook(() => useEntries());
      const initialDate = new Date('2023-01-01').getTime();
      const updatedDate = new Date('2023-02-02').getTime();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addEntry('Original text', initialDate);
      });

      const entryId = result.current.entries[0].id;
      expect(result.current.entries[0].citationDate).toBe(initialDate);

      await act(async () => {
        await result.current.updateEntry(entryId, 'Updated text', updatedDate);
      });

      const updated = result.current.entries[0];
      expect(updated.citationDate).toBe(updatedDate);
    });

    it('should update attached links', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addEntry('Original text', Date.now());
      });

      const entryId = result.current.entries[0].id;
      const links = [{ id: 'link-1', url: 'https://example.com/updated', addedAt: Date.now() }];

      await act(async () => {
        await result.current.updateEntry(entryId, 'Original text', Date.now(), undefined, [], undefined, undefined, [], [], undefined, new Map(), undefined, undefined, links);
      });

      expect(result.current.entries[0].links).toEqual(links);
    });

    it('should throw when updating non-existent entry', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateEntry('non-existent-id', 'text', Date.now());
        })
      ).rejects.toThrow('Entry not found');
    });

    it('should delete image attachments from entry on update', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create an entry with manually added image attachments
      const entryId = 'entry-with-images';
      const now = Date.now();

      await dbService.add(STORES.ENTRIES, {
        id: entryId,
        text: 'Entry with images',
        labelIds: [],
        imageAttachments: [
          { id: 'img-1', mimeType: 'image/png', size: 100, order: 0, createdAt: now },
          { id: 'img-2', mimeType: 'image/png', size: 100, order: 1, createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      });

      // Add attachments to the entry document
      await dbService.putAttachment(STORES.ENTRIES, entryId, 'image-img-1', new Blob(['data1']), 'image/png');
      await dbService.putAttachment(STORES.ENTRIES, entryId, 'image-img-2', new Blob(['data2']), 'image/png');

      await act(async () => {
        await result.current.reload();
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].imageAttachments).toHaveLength(2);

      // Delete img-1 via updateEntry
      await act(async () => {
        await result.current.updateEntry(
          entryId, 'Entry with images', Date.now(), undefined, [],
          undefined, undefined,
          [], // imagesToAdd
          ['img-1'], // imagesToDelete
        );
      });

      const updated = result.current.entries[0];
      expect(updated.imageAttachments).toHaveLength(1);
      expect(updated.imageAttachments[0].id).toBe('img-2');

      // Verify img-2 attachment still exists
      const blob2 = await dbService.getAttachment(STORES.ENTRIES, entryId, 'image-img-2');
      expect(blob2).toBeDefined();
    });

    it('should reorder image attachments on update', async () => {
      const { result } = renderHook(() => useEntries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const entryId = 'entry-reorder';
      const now = Date.now();

      await dbService.add(STORES.ENTRIES, {
        id: entryId,
        text: 'Reorder test',
        labelIds: [],
        imageAttachments: [
          { id: 'img-0', mimeType: 'image/png', size: 100, order: 0, createdAt: now },
          { id: 'img-1', mimeType: 'image/png', size: 100, order: 1, createdAt: now },
          { id: 'img-2', mimeType: 'image/png', size: 100, order: 2, createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      });

      await act(async () => {
        await result.current.reload();
      });

      // Reorder: move img-2 to front
      await act(async () => {
        await result.current.updateEntry(
          entryId, 'Reorder test', Date.now(), undefined, [],
          undefined, undefined,
          [], // imagesToAdd
          [], // imagesToDelete
          ['img-2', 'img-0', 'img-1'], // imageIdsOrder
        );
      });

      const updated = result.current.entries[0];
      expect(updated.imageAttachments.map((m) => m.id)).toEqual(['img-2', 'img-0', 'img-1']);
      expect(updated.imageAttachments[0].order).toBe(0);
      expect(updated.imageAttachments[1].order).toBe(1);
      expect(updated.imageAttachments[2].order).toBe(2);
    });

    it('should preserve imageAttachments when no image changes provided', async () => {
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
        imageAttachments: [
          { id: 'img-a', mimeType: 'image/png', size: 100, order: 0, createdAt: now },
          { id: 'img-b', mimeType: 'image/png', size: 100, order: 1, createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      });

      await act(async () => {
        await result.current.reload();
      });

      // Update text only, no image changes
      await act(async () => {
        await result.current.updateEntry(entryId, 'Updated text', Date.now());
      });

      const updated = result.current.entries[0];
      expect(updated.text).toBe('Updated text');
      expect(updated.imageAttachments).toHaveLength(2);
      expect(updated.imageAttachments.map((m) => m.id)).toEqual(['img-a', 'img-b']);
    });
  });
});

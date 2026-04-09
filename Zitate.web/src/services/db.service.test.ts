import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from './db.service';
import { STORES } from '../db/schema';
import { Entry, Author, Label } from '../models';

describe('DBService', () => {
  beforeEach(async () => {
    await dbService.init();
    // Clear all stores before each test
    for (const store of Object.values(STORES)) {
      await dbService.clear(store);
    }
  });

  describe('add and get', () => {
    it('should add and retrieve an entry', async () => {
      const entry: Entry = {
        id: 'test-entry-1',
        text: 'Test entry text',
        latitude: 52.52,
        longitude: 13.405,
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.add(STORES.ENTRIES, entry);
      const retrieved = await dbService.get<Entry>(STORES.ENTRIES, entry.id);

      expect(retrieved).toEqual(entry);
    });

    it('should add and retrieve an author', async () => {
      const author: Author = {
        id: 'author-1',
        name: 'John Doe',
      };

      await dbService.add(STORES.AUTHORS, author);
      const retrieved = await dbService.get<Author>(STORES.AUTHORS, author.id);

      expect(retrieved).toEqual(author);
    });

    it('should return undefined for non-existent item', async () => {
      const result = await dbService.get(STORES.ENTRIES, 'non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should retrieve all items from a store', async () => {
      const entries: Entry[] = [
        {
          id: 'entry-1',
          text: 'First entry',
          labelIds: [],
          imageAttachments: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'entry-2',
          text: 'Second entry',
          labelIds: [],
          imageAttachments: [],
          createdAt: Date.now() + 1000,
          updatedAt: Date.now() + 1000,
        },
      ];

      for (const entry of entries) {
        await dbService.add(STORES.ENTRIES, entry);
      }

      const all = await dbService.getAll<Entry>(STORES.ENTRIES);
      expect(all).toHaveLength(2);
      expect(all).toEqual(expect.arrayContaining(entries));
    });

    it('should return empty array for empty store', async () => {
      const all = await dbService.getAll(STORES.ENTRIES);
      expect(all).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const entry: Entry = {
        id: 'entry-1',
        text: 'Original text',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.add(STORES.ENTRIES, entry);

      const updated: Entry = {
        ...entry,
        text: 'Updated text',
        updatedAt: Date.now() + 1000,
      };

      await dbService.update(STORES.ENTRIES, updated);

      const retrieved = await dbService.get<Entry>(STORES.ENTRIES, entry.id);
      expect(retrieved?.text).toBe('Updated text');
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      const label: Label = {
        id: 'label-1',
        name: 'Important',
      };

      await dbService.add(STORES.LABELS, label);
      await dbService.delete(STORES.LABELS, label.id);

      const retrieved = await dbService.get(STORES.LABELS, label.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('query', () => {
    it('should query items by index', async () => {
      const now = Date.now();
      const entries: Entry[] = [
        {
          id: 'entry-1',
          text: 'First',
          labelIds: [],
          imageAttachments: [],
          createdAt: now - 2000,
          updatedAt: now - 2000,
        },
        {
          id: 'entry-2',
          text: 'Second',
          labelIds: [],
          imageAttachments: [],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'entry-3',
          text: 'Third',
          labelIds: [],
          imageAttachments: [],
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const entry of entries) {
        await dbService.add(STORES.ENTRIES, entry);
      }

      // Query using key range equivalent — entries with createdAt <= now - 1000
      const results = await dbService.query<Entry>(
        STORES.ENTRIES,
        'createdAt',
        { lower: undefined, upper: now - 1000 }
      );

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.id)).toContain('entry-1');
      expect(results.map((e) => e.id)).toContain('entry-2');
    });
  });

  describe('getAllEntriesSorted', () => {
    it('should return entries sorted by creation date descending', async () => {
      const now = Date.now();
      const entries: Entry[] = [
        {
          id: 'entry-1',
          text: 'Oldest',
          labelIds: [],
          imageAttachments: [],
          createdAt: now - 3000,
          updatedAt: now - 3000,
        },
        {
          id: 'entry-2',
          text: 'Middle',
          labelIds: [],
          imageAttachments: [],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'entry-3',
          text: 'Newest',
          labelIds: [],
          imageAttachments: [],
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const entry of entries) {
        await dbService.add(STORES.ENTRIES, entry);
      }

      const sorted = await dbService.getAllEntriesSorted<Entry>();

      expect(sorted).toHaveLength(3);
      expect(sorted[0].id).toBe('entry-3');
      expect(sorted[1].id).toBe('entry-2');
      expect(sorted[2].id).toBe('entry-1');
    });

    it('should return empty array when no entries exist', async () => {
      const sorted = await dbService.getAllEntriesSorted();
      expect(sorted).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return the number of items', async () => {
      await dbService.add(STORES.LABELS, { id: 'l1', name: 'a' });
      await dbService.add(STORES.LABELS, { id: 'l2', name: 'b' });
      expect(await dbService.count(STORES.LABELS)).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all items of a given type', async () => {
      await dbService.add(STORES.LABELS, { id: 'l1', name: 'a' });
      await dbService.add(STORES.LABELS, { id: 'l2', name: 'b' });
      await dbService.clear(STORES.LABELS);
      expect(await dbService.count(STORES.LABELS)).toBe(0);
    });
  });

  describe('attachments', () => {
    it('should put and get an attachment on an entry document', async () => {
      const entry: Entry = {
        id: 'attach-entry-1',
        text: 'Entry with attachment',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.add(STORES.ENTRIES, entry);

      const blob = new Blob(['fake-image-data'], { type: 'image/png' });
      await dbService.putAttachment(STORES.ENTRIES, entry.id, 'image-abc', blob, 'image/png');

      const retrieved = await dbService.getAttachment(STORES.ENTRIES, entry.id, 'image-abc');
      expect(retrieved).toBeDefined();
    });

    it('should remove an attachment from a document', async () => {
      const entry: Entry = {
        id: 'attach-entry-2',
        text: 'Entry for removal',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.add(STORES.ENTRIES, entry);

      const blob = new Blob(['data'], { type: 'image/jpeg' });
      await dbService.putAttachment(STORES.ENTRIES, entry.id, 'image-xyz', blob, 'image/jpeg');

      await dbService.removeAttachment(STORES.ENTRIES, entry.id, 'image-xyz');

      await expect(
        dbService.getAttachment(STORES.ENTRIES, entry.id, 'image-xyz')
      ).rejects.toThrow();
    });

    it('should support multiple attachments on the same document', async () => {
      const entry: Entry = {
        id: 'attach-entry-3',
        text: 'Entry with multiple attachments',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.add(STORES.ENTRIES, entry);

      const blob1 = new Blob(['image-1'], { type: 'image/png' });
      const blob2 = new Blob(['image-2'], { type: 'image/jpeg' });
      await dbService.putAttachment(STORES.ENTRIES, entry.id, 'image-a', blob1, 'image/png');
      await dbService.putAttachment(STORES.ENTRIES, entry.id, 'image-b', blob2, 'image/jpeg');

      const retrieved1 = await dbService.getAttachment(STORES.ENTRIES, entry.id, 'image-a');
      const retrieved2 = await dbService.getAttachment(STORES.ENTRIES, entry.id, 'image-b');
      expect(retrieved1).toBeDefined();
      expect(retrieved2).toBeDefined();
    });

    it('should not destroy existing document data when adding attachment', async () => {
      const entry: Entry = {
        id: 'attach-entry-4',
        text: 'Preserved text',
        labelIds: ['label-1'],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.add(STORES.ENTRIES, entry);

      const blob = new Blob(['data'], { type: 'image/png' });
      await dbService.putAttachment(STORES.ENTRIES, entry.id, 'image-keep', blob, 'image/png');

      const retrieved = await dbService.get<Entry>(STORES.ENTRIES, entry.id);
      expect(retrieved?.text).toBe('Preserved text');
      expect(retrieved?.labelIds).toEqual(['label-1']);
    });
  });
});

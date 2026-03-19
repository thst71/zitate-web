import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from './db.service';
import { STORES } from '../db/schema';
import { Entry, Author, Label } from '../models';

describe('DBService', () => {
  beforeEach(async () => {
    // Clear all stores before each test
    const stores = Object.values(STORES);
    for (const store of stores) {
      const all = await dbService.getAll(store);
      for (const item of all) {
        await dbService.delete(store, (item as { id: string }).id);
      }
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
        imageIds: [],
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
        createdAt: Date.now(),
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
          imageIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'entry-2',
          text: 'Second entry',
          labelIds: [],
          imageIds: [],
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
        imageIds: [],
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
        createdAt: Date.now(),
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
          imageIds: [],
          createdAt: now - 2000,
          updatedAt: now - 2000,
        },
        {
          id: 'entry-2',
          text: 'Second',
          labelIds: [],
          imageIds: [],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'entry-3',
          text: 'Third',
          labelIds: [],
          imageIds: [],
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const entry of entries) {
        await dbService.add(STORES.ENTRIES, entry);
      }

      const results = await dbService.query<Entry>(
        STORES.ENTRIES,
        'createdAt',
        IDBKeyRange.upperBound(now - 1000)
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
          imageIds: [],
          createdAt: now - 3000,
          updatedAt: now - 3000,
        },
        {
          id: 'entry-2',
          text: 'Middle',
          labelIds: [],
          imageIds: [],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'entry-3',
          text: 'Newest',
          labelIds: [],
          imageIds: [],
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const entry of entries) {
        await dbService.add(STORES.ENTRIES, entry);
      }

      const sorted = await dbService.getAllEntriesSorted();

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
});

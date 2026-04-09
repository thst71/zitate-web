import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { dbService } from './db.service';
import { migrationService } from './migration.service';
import { STORES } from '../db/schema';

const LEGACY_DB_NAME = 'zitate-db';
const MIGRATION_FLAG = 'zitate-migration-complete';

/**
 * Helper: create legacy IndexedDB with all expected object stores.
 */
async function createLegacyDb(): Promise<void> {
  const request = indexedDB.open(LEGACY_DB_NAME, 1);
  await new Promise<void>((resolve, reject) => {
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ['entries', 'authors', 'labels', 'images', 'audio', 'folders']) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Helper: seed a legacy object store with records.
 */
async function seedLegacyStore(storeName: string, records: Array<Record<string, unknown>>): Promise<void> {
  const request = indexedDB.open(LEGACY_DB_NAME, 1);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = db.transaction([storeName], 'readwrite');
  const store = tx.objectStore(storeName);
  for (const record of records) {
    store.put(record);
  }
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
}

describe('MigrationService', () => {
  beforeEach(async () => {
    // Ensure clean state
    window.localStorage.clear();
    await dbService.destroy();
    await createLegacyDb();
  });

  afterEach(async () => {
    await dbService.destroy();
    window.localStorage.clear();

    const req = indexedDB.deleteDatabase(LEGACY_DB_NAME);
    await new Promise<void>((resolve) => {
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  it('should detect legacy db when it exists', async () => {
    const hasLegacy = await migrationService.checkLegacyDbExists();
    expect(hasLegacy).toBe(true);
  });

  it('should return false when migration flag is already set', async () => {
    window.localStorage.setItem(MIGRATION_FLAG, 'true');
    const hasLegacy = await migrationService.checkLegacyDbExists();
    expect(hasLegacy).toBe(false);
  });

  it('should migrate entries successfully', async () => {
    await seedLegacyStore('entries', [
      { id: 'uuid-1', text: 'Legacy entry text', labelIds: [], imageIds: [], createdAt: Date.now(), updatedAt: Date.now() },
    ]);

    await migrationService.migrate(dbService);

    const pouchDb = await dbService.getDb();
    const migrated = await pouchDb.get('entry:uuid-1') as Record<string, unknown>;
    expect(migrated).toBeDefined();
    expect(migrated.type).toBe('entry');
    expect(migrated.text).toBe('Legacy entry text');
    // v3 fields should be initialised
    expect(migrated.imageAttachments).toEqual([]);

    // Migration flag should be set
    expect(window.localStorage.getItem(MIGRATION_FLAG)).toBe('true');
  });

  it('should migrate authors, labels and folders', async () => {
    await seedLegacyStore('authors', [
      { id: 'a1', name: 'Goethe' },
    ]);
    await seedLegacyStore('labels', [
      { id: 'l1', name: 'philosophy' },
    ]);
    await seedLegacyStore('folders', [
      { id: 'f1', name: 'Favorites', criteria: {}, order: 0, createdAt: Date.now() },
    ]);
    // Need at least one entry for the migration to proceed
    await seedLegacyStore('entries', [
      { id: 'e1', text: 'Test', labelIds: ['l1'], imageIds: [], createdAt: Date.now(), updatedAt: Date.now() },
    ]);

    await migrationService.migrate(dbService);

    const author = await dbService.get<{ id: string; name: string }>(STORES.AUTHORS, 'a1');
    expect(author?.name).toBe('Goethe');

    const label = await dbService.get<{ id: string; name: string }>(STORES.LABELS, 'l1');
    expect(label?.name).toBe('philosophy');

    const folder = await dbService.get<{ id: string; name: string }>(STORES.FOLDERS, 'f1');
    expect(folder?.name).toBe('Favorites');
  });

  it('should migrate images as PouchDB attachments with correct v3 naming and metadata', async () => {
    const now = Date.now();
    await seedLegacyStore('entries', [
      { id: 'e1', text: 'Entry with image', labelIds: [], imageIds: ['img-1'], createdAt: now, updatedAt: now },
    ]);
    await seedLegacyStore('images', [
      { id: 'img-1', entryId: 'e1', blob: new Blob(['pixel-data'], { type: 'image/png' }), mimeType: 'image/png', size: 42, order: 0, createdAt: now },
    ]);

    await migrationService.migrate(dbService);

    // Entry should have imageAttachments metadata with correct v3 naming
    const pouchDb = await dbService.getDb();
    const entry = await pouchDb.get('entry:e1') as Record<string, unknown>;
    const metas = entry.imageAttachments as Array<{ id: string; mimeType: string; order: number }>;
    expect(metas).toHaveLength(1);
    expect(metas[0].id).toBe('img-1');
    expect(metas[0].mimeType).toBe('image/png');
    expect(metas[0].order).toBe(0);

    // Attachment should be present (v3 naming: image-<id>, not images-<id>)
    const doc = await pouchDb.get('entry:e1') as Record<string, unknown>;
    const attachments = doc._attachments as Record<string, unknown> | undefined;
    if (attachments) {
      // Verify the correct attachment name convention is used
      expect(attachments['image-img-1']).toBeDefined();
      expect(attachments['images-img-1']).toBeUndefined(); // old naming must NOT be used
    }
  });

  it('should call onProgress during migration', async () => {
    await seedLegacyStore('entries', [
      { id: 'e1', text: 'Test', labelIds: [], imageIds: [], createdAt: Date.now(), updatedAt: Date.now() },
    ]);

    const onProgress = vi.fn();
    await migrationService.migrate(dbService, onProgress);

    expect(onProgress).toHaveBeenCalledWith('Opening legacy database...');
    expect(onProgress).toHaveBeenCalledWith('Migration complete.');
  });

  it('should skip migration when flag is already set', async () => {
    await seedLegacyStore('entries', [
      { id: 'e1', text: 'Should not migrate', labelIds: [], imageIds: [], createdAt: Date.now(), updatedAt: Date.now() },
    ]);

    window.localStorage.setItem(MIGRATION_FLAG, 'true');
    await migrationService.migrate(dbService);

    const result = await dbService.get(STORES.ENTRIES, 'e1');
    expect(result).toBeUndefined();
  });
});

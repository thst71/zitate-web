/**
 * MigrationService – One-time migration from legacy idb-based IndexedDB
 * to PouchDB with v3 attachment schema.
 *
 * Legacy idb stores: entries, authors, labels, images, audio, folders
 * PouchDB v3: documents with type prefixes + images/audio as attachments
 * on entry documents with `imageAttachments` / `audioAttachment` metadata.
 */
import { STORES, type StoreType, buildId } from '../db/schema';
import type { ImageAttachmentMeta } from '../models';
import type { AudioAttachmentMeta } from '../models';
import type { dbService as DbServiceInstance } from './db.service';

type DbServiceType = typeof DbServiceInstance;

const LEGACY_DB_NAME = 'zitate-db';
const MIGRATION_FLAG = 'zitate-migration-complete';

/** Shape of a legacy image record from idb. */
interface LegacyImageRecord {
  id: string;
  entryId: string;
  blob: Blob;
  mimeType: string;
  size: number;
  order: number;
  createdAt: number;
}

/** Shape of a legacy audio record from idb. */
interface LegacyAudioRecord {
  id: string;
  entryId: string;
  blob: Blob;
  mimeType: string;
  duration: number;
  createdAt: number;
}

/** Minimal shape for a legacy record with at least an id. */
interface LegacyRecord {
  id: string;
  [key: string]: unknown;
}

class MigrationService {
  /**
   * Check if the legacy database exists and has not been migrated yet.
   */
  async checkLegacyDbExists(): Promise<boolean> {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_FLAG) === 'true') {
      return false;
    }

    try {
      if (typeof indexedDB.databases === 'function') {
        const dbs = await indexedDB.databases();
        const exists = dbs.some(db => db.name === LEGACY_DB_NAME);
        if (!exists) return false;
      }
    } catch {
      // databases() not supported or failed, proceed to fallback checking
    }

    return new Promise<boolean>((resolve) => {
      let isNew = false;
      const request = indexedDB.open(LEGACY_DB_NAME);

      request.onupgradeneeded = () => {
        isNew = true;
        request.transaction?.abort();
      };

      request.onsuccess = () => {
        if (isNew) {
          resolve(false);
          return;
        }
        const db = request.result;
        const hasLegacyStores = db.objectStoreNames.contains('entries');
        db.close();
        resolve(hasLegacyStores);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  /**
   * Migrate all data from the legacy IndexedDB to PouchDB.
   *
   * Processing order matters:
   *  1. Entries first (images/audio attach to entry documents)
   *  2. Authors, labels, folders (independent documents)
   *  3. Images → PouchDB attachments + imageAttachments metadata on entry
   *  4. Audio  → PouchDB attachments + audioAttachment metadata on entry
   */
  async migrate(svc: DbServiceType, onProgress?: (msg: string) => void): Promise<void> {
    if (!(await this.checkLegacyDbExists())) {
      return;
    }

    onProgress?.('Opening legacy database...');
    const legacyDb = await this.openLegacyDb();
    const pouchDb = await svc.getDb();

    // --- Phase 1: Migrate document stores ---
    const docStores: Array<{ legacy: string; prefix: StoreType }> = [
      { legacy: 'entries', prefix: STORES.ENTRIES },
      { legacy: 'authors', prefix: STORES.AUTHORS },
      { legacy: 'labels',  prefix: STORES.LABELS },
      { legacy: 'folders', prefix: STORES.FOLDERS },
    ];

    for (const { legacy, prefix } of docStores) {
      if (!legacyDb.objectStoreNames.contains(legacy)) continue;
      onProgress?.(`Migrating ${legacy}...`);
      const records = await this.getAllFromLegacyStore<LegacyRecord>(legacyDb, legacy);

      for (const record of records) {
        const { id, ...rest } = record;
        const pouchDocId = buildId(prefix, id);
        try {
          const existing = await pouchDb.get(pouchDocId).catch(() => null);
          if (!existing) {
            await pouchDb.put({
              _id: pouchDocId,
              type: prefix,
              ...rest,
              // Ensure v3 fields exist on entry documents
              ...(prefix === STORES.ENTRIES ? { imageAttachments: [], links: rest.links ?? [] } : {}),
            });
          }
        } catch {
          // Skip records that fail to migrate
        }
      }
    }

    // --- Phase 2: Migrate images to PouchDB attachments ---
    if (legacyDb.objectStoreNames.contains('images')) {
      onProgress?.('Migrating images...');
      const images = await this.getAllFromLegacyStore<LegacyImageRecord>(legacyDb, 'images');

      // Group images by entryId so we can batch-update the entry metadata
      const imagesByEntry = new Map<string, LegacyImageRecord[]>();
      for (const img of images) {
        if (!img.entryId) continue;
        if (!imagesByEntry.has(img.entryId)) {
          imagesByEntry.set(img.entryId, []);
        }
        imagesByEntry.get(img.entryId)!.push(img);
      }

      for (const [entryId, entryImages] of imagesByEntry.entries()) {
        const entryDocId = buildId(STORES.ENTRIES, entryId);
        const metas: ImageAttachmentMeta[] = [];

        for (const img of entryImages) {
          // Attachment name follows v3 convention: image-<uuid>
          const attachmentName = `image-${img.id}`;
          try {
            const fresh = await pouchDb.get(entryDocId);
            await pouchDb.putAttachment(
              entryDocId, attachmentName, fresh._rev,
              img.blob, img.mimeType || 'image/jpeg'
            );
          } catch {
            // Blob storage may fail in some environments; metadata is still recorded
          }
          metas.push({
            id: img.id,
            mimeType: img.mimeType || 'image/jpeg',
            size: img.size || 0,
            order: img.order || 0,
            createdAt: img.createdAt || Date.now(),
          });
        }

        // Update entry document with imageAttachments metadata
        if (metas.length > 0) {
          try {
            const freshEntry = await pouchDb.get(entryDocId) as Record<string, unknown>;
            freshEntry.imageAttachments = metas.sort((a, b) => a.order - b.order);
            await pouchDb.put(freshEntry as PouchDB.Core.PutDocument<Record<string, unknown>>);
          } catch {
            // Skip metadata update on failure
          }
        }
      }
    }

    // --- Phase 3: Migrate audio to PouchDB attachments ---
    if (legacyDb.objectStoreNames.contains('audio')) {
      onProgress?.('Migrating audio...');
      const audioRecords = await this.getAllFromLegacyStore<LegacyAudioRecord>(legacyDb, 'audio');

      for (const audioRec of audioRecords) {
        if (!audioRec.entryId) continue;
        const entryDocId = buildId(STORES.ENTRIES, audioRec.entryId);
        const attachmentName = `audio-${audioRec.id}`;

        try {
          const fresh = await pouchDb.get(entryDocId);
          await pouchDb.putAttachment(
            entryDocId, attachmentName, fresh._rev,
            audioRec.blob, audioRec.mimeType || 'audio/webm'
          );
        } catch {
          // Blob storage may fail in some environments; metadata is still recorded
        }

        try {
          // Update entry with audioAttachment metadata
          const freshEntry = await pouchDb.get(entryDocId) as Record<string, unknown>;
          const meta: AudioAttachmentMeta = {
            id: audioRec.id,
            mimeType: audioRec.mimeType || 'audio/webm',
            duration: audioRec.duration || 0,
            createdAt: audioRec.createdAt || Date.now(),
          };
          freshEntry.audioAttachment = meta;
          await pouchDb.put(freshEntry as PouchDB.Core.PutDocument<Record<string, unknown>>);
        } catch {
          // Skip on failure
        }
      }
    }

    legacyDb.close();
    localStorage.setItem(MIGRATION_FLAG, 'true');
    onProgress?.('Migration complete.');
  }

  private openLegacyDb(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(LEGACY_DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getAllFromLegacyStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }
}

export const migrationService = new MigrationService();

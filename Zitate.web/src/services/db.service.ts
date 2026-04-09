/**
 * PouchDB Service - Wrapper for database operations.
 *
 * Replaces the previous idb-based IndexedDB wrapper.
 * Public API is kept compatible: callers pass a storeName (type prefix)
 * and data objects that carry an `id` field.  Internally the service
 * maps them to PouchDB documents with `_id = <type>:<uuid>` and a
 * `type` field.
 *
 * Since schema v3, images and audio are stored as PouchDB attachments
 * on entry documents rather than in separate document stores.
 */
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import { DB_NAME, DB_VERSION, STORES, LEGACY_STORES, type StoreType, buildId, extractUuid, getDesignDocuments } from '../db/schema';
import type { ImageAttachmentMeta } from '../models';

PouchDB.plugin(PouchDBFind);

/** Local document that tracks the schema version inside PouchDB. */
const SCHEMA_VERSION_DOC_ID = '_local/schema_version';

interface SchemaVersionDoc {
  _id: string;
  _rev?: string;
  version: number;
}

/** Minimal shape we expect on every data object handed to add/update. */
interface HasId {
  id: string;
  [key: string]: unknown;
}

/** Internal PouchDB document shape. */
interface PouchDoc {
  _id: string;
  _rev?: string;
  type: string;
  [key: string]: unknown;
}

class DBService {
  private db: PouchDB.Database | null = null;
  private initPromise: Promise<PouchDB.Database> | null = null;

  /**
   * Initialise (or return existing) PouchDB database and ensure design
   * documents are up-to-date.
   *
   * Design documents are only reinstalled when DB_VERSION changes, which
   * avoids unnecessary writes on every app start.
   */
  async init(): Promise<PouchDB.Database> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const db = new PouchDB(DB_NAME);

      // Check stored schema version
      let storedVersion = 0;
      let versionDoc: SchemaVersionDoc | null = null;
      try {
        versionDoc = await db.get(SCHEMA_VERSION_DOC_ID) as SchemaVersionDoc;
        storedVersion = versionDoc.version ?? 0;
      } catch {
        // Document doesn't exist yet – first run
      }

      if (storedVersion < DB_VERSION) {
        // Install / update design documents
        const designDocs = getDesignDocuments();
        for (const ddoc of designDocs) {
          try {
            const existing = await db.get(ddoc._id).catch(() => null);
            if (existing) {
              await db.put({ ...ddoc, _rev: (existing as PouchDoc)._rev });
            } else {
              await db.put(ddoc as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);
            }
          } catch {
            // Ignore conflicts – design doc already up-to-date
          }
        }

        // Remove obsolete design documents (images, audio)
        for (const obsoleteId of ['_design/images', '_design/audio']) {
          try {
            const doc = await db.get(obsoleteId);
            await db.remove(doc);
          } catch {
            // Already gone
          }
        }

        // Migration: v2 → v3 – move image/audio docs to entry attachments
        if (storedVersion > 0 && storedVersion < 3) {
          await this.migrateAttachmentsV2toV3(db);
        }

        // Persist the new schema version
        const newVersionDoc: SchemaVersionDoc = {
          _id: SCHEMA_VERSION_DOC_ID,
          version: DB_VERSION,
          ...(versionDoc?._rev ? { _rev: versionDoc._rev } : {}),
        };
        await db.put(newVersionDoc as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);
      }

      this.db = db;
      return db;
    })();

    return this.initPromise;
  }

  // ────────────────────── migration ──────────────────────

  /**
   * Migrate legacy separate image/audio documents to PouchDB attachments
   * on their parent entry documents.
   */
  private async migrateAttachmentsV2toV3(db: PouchDB.Database): Promise<void> {
    // Collect all legacy image documents
    const imagePrefix = `${LEGACY_STORES.IMAGES}:`;
    const imageResult = await db.allDocs({
      include_docs: true,
      startkey: imagePrefix,
      endkey: `${imagePrefix}\ufff0`,
    });

    // Group images by entryId
    const imagesByEntry = new Map<string, Array<PouchDoc & { blob?: Blob }>>();
    for (const row of imageResult.rows) {
      if (!row.doc) continue;
      const doc = row.doc as PouchDoc;
      const entryId = doc.entryId as string;
      if (!entryId) continue;
      if (!imagesByEntry.has(entryId)) {
        imagesByEntry.set(entryId, []);
      }
      imagesByEntry.get(entryId)!.push(doc);
    }

    // Migrate each entry's images
    for (const [entryId, imageDocs] of imagesByEntry.entries()) {
      const entryDocId = buildId(STORES.ENTRIES, entryId);
      try {
        const metas: ImageAttachmentMeta[] = [];

        for (const imgDoc of imageDocs) {
          const imgUuid = extractUuid(imgDoc._id);
          const attachmentName = `image-${imgUuid}`;
          const blob = imgDoc.blob as unknown as Blob;
          if (blob) {
            // Re-read entry to get latest _rev after each putAttachment
            const fresh = await db.get(entryDocId);
            const currentRev: string = fresh._rev;
            await db.putAttachment(
              entryDocId, attachmentName, currentRev,
              blob, (imgDoc.mimeType as string) || 'image/jpeg'
            );
          }
          metas.push({
            id: imgUuid,
            mimeType: (imgDoc.mimeType as string) || 'image/jpeg',
            size: (imgDoc.size as number) || 0,
            order: (imgDoc.order as number) || 0,
            createdAt: (imgDoc.createdAt as number) || Date.now(),
          });
        }

        // Update entry document with imageAttachments metadata
        const freshEntry = await db.get(entryDocId) as PouchDoc;
        freshEntry.imageAttachments = metas.sort((a, b) => a.order - b.order);
        // Remove legacy fields
        delete freshEntry.imageIds;
        delete freshEntry.audioId;
        await db.put(freshEntry as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);

        // Delete old image documents
        for (const imgDoc of imageDocs) {
          try {
            const current = await db.get(imgDoc._id);
            await db.remove(current);
          } catch {
            // Already removed
          }
        }
      } catch {
        // Entry not found or migration error — skip silently
      }
    }

    // Migrate audio documents similarly
    const audioPrefix = `${LEGACY_STORES.AUDIO}:`;
    const audioResult = await db.allDocs({
      include_docs: true,
      startkey: audioPrefix,
      endkey: `${audioPrefix}\ufff0`,
    });

    for (const row of audioResult.rows) {
      if (!row.doc) continue;
      const doc = row.doc as PouchDoc;
      const entryId = doc.entryId as string;
      if (!entryId) continue;

      const entryDocId = buildId(STORES.ENTRIES, entryId);
      try {
        const audioUuid = extractUuid(doc._id);
        const attachmentName = `audio-${audioUuid}`;
        const blob = doc.blob as unknown as Blob;
        if (blob) {
          const fresh = await db.get(entryDocId);
          await db.putAttachment(
            entryDocId, attachmentName, fresh._rev,
            blob, (doc.mimeType as string) || 'audio/webm'
          );
        }

        const freshEntry = await db.get(entryDocId) as PouchDoc;
        freshEntry.audioAttachment = {
          id: audioUuid,
          mimeType: (doc.mimeType as string) || 'audio/webm',
          duration: (doc.duration as number) || 0,
          createdAt: (doc.createdAt as number) || Date.now(),
        };
        delete freshEntry.audioId;
        await db.put(freshEntry as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);

        // Delete old audio document
        try {
          const current = await db.get(doc._id);
          await db.remove(current);
        } catch {
          // Already removed
        }
      } catch {
        // Entry not found or migration error — skip silently
      }
    }

    // Clean up entries that had imageIds but no actual images (normalize)
    const entryPrefix = `${STORES.ENTRIES}:`;
    const entryResult = await db.allDocs({
      include_docs: true,
      startkey: entryPrefix,
      endkey: `${entryPrefix}\ufff0`,
    });
    for (const row of entryResult.rows) {
      if (!row.doc) continue;
      const doc = row.doc as PouchDoc;
      if (doc.imageIds && !doc.imageAttachments) {
        doc.imageAttachments = [];
        delete doc.imageIds;
        delete doc.audioId;
        await db.put(doc as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>);
      }
    }
  }

  // ────────────────────── helpers ──────────────────────

  /**
   * Convert an internal PouchDB document back to the public model shape.
   * Strips `_id`, `_rev`, `type` and restores `id`.
   */
  private toModel<T>(doc: PouchDoc): T {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _rev, type, _attachments, ...rest } = doc;
    return { ...rest, id: extractUuid(_id) } as unknown as T;
  }

  /**
   * Convert a public model object into a PouchDB document.
   */
  private toDoc(storeName: string, data: HasId): PouchDoc {
    const { id, ...rest } = data;
    return {
      _id: buildId(storeName as StoreType, id),
      type: storeName,
      ...rest,
    };
  }

  // ────────────────────── CRUD ──────────────────────

  /**
   * Get a single item by ID.
   */
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();
    try {
      const doc = await db.get(buildId(storeName as StoreType, id)) as PouchDoc;
      return this.toModel<T>(doc);
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status === 404) return undefined;
      throw err;
    }
  }

  /**
   * Get all items of a given type.
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    const prefix = `${storeName}:`;
    const result = await db.allDocs({
      include_docs: true,
      startkey: prefix,
      endkey: `${prefix}\ufff0`,
    });
    return result.rows
      .filter((r) => r.doc && !(r.doc as PouchDoc)._id.startsWith('_design/'))
      .map((r) => this.toModel<T>(r.doc as PouchDoc));
  }

  /**
   * Add a new item.  The data object must carry an `id` field.
   */
  async add<T>(storeName: string, data: T): Promise<string> {
    const db = await this.init();
    const doc = this.toDoc(storeName, data as unknown as HasId);
    const resp = await db.put(doc);
    return resp.id;
  }

  /**
   * Update an existing item (upsert).
   * Preserves PouchDB attachments by carrying forward the `_attachments`
   * stub from the existing document revision.
   */
  async update<T>(storeName: string, data: T): Promise<string> {
    const db = await this.init();
    const doc = this.toDoc(storeName, data as unknown as HasId);
    try {
      const existing = await db.get(doc._id) as PouchDoc;
      doc._rev = existing._rev;
      // Preserve binary attachments that live on the document
      if (existing._attachments) {
        doc._attachments = existing._attachments;
      }
    } catch {
      // New document – no _rev needed
    }
    const resp = await db.put(doc);
    return resp.id;
  }

  /**
   * Delete an item by ID.
   */
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    const docId = buildId(storeName as StoreType, id);
    try {
      const existing = await db.get(docId);
      await db.remove(existing);
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status === 404) return; // already gone
      throw err;
    }
  }

  /**
   * Query items using a design-document view.
   *
   * The old idb-based API was: query(storeName, indexName, value).
   * We map this to the corresponding design-doc view.
   */
  async query<T>(
    storeName: string,
    indexName: string,
    value: unknown
  ): Promise<T[]> {
    const db = await this.init();

    // Map store type prefix to design doc name (plural form used in _design/*)
    const designDocMap: Record<string, string> = {
      entry: 'entries',
      author: 'authors',
      label: 'labels',
      folder: 'folders',
    };
    const designName = designDocMap[storeName] || `${storeName}s`;
    const viewName = `${designName}/by_${indexName}`;

    // Build query options depending on value type
    const opts: PouchDB.Query.Options<Record<string, unknown>, Record<string, unknown>> = {
      include_docs: true,
    };

    if (value !== null && value !== undefined && typeof value === 'object' && 'lower' in (value as Record<string, unknown>)) {
      // IDBKeyRange-like objects (upper/lower bounds) – simplification
      const range = value as { lower?: unknown; upper?: unknown };
      if (range.lower !== undefined) opts.startkey = range.lower;
      if (range.upper !== undefined) opts.endkey = range.upper;
    } else {
      opts.key = value as string | number;
    }

    const result = await db.query<Record<string, unknown>>(viewName, opts);
    return result.rows
      .filter((r) => r.doc)
      .map((r) => this.toModel<T>(r.doc as unknown as PouchDoc));
  }

  /**
   * Count items in a store (by type).
   */
  async count(storeName: string): Promise<number> {
    const all = await this.getAll(storeName);
    return all.length;
  }

  /**
   * Clear all data of a given type.
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    const prefix = `${storeName}:`;
    const result = await db.allDocs({
      startkey: prefix,
      endkey: `${prefix}\ufff0`,
    });
    const deletions = result.rows.map((r) => ({
      _id: r.id,
      _rev: r.value.rev,
      _deleted: true,
    }));
    if (deletions.length > 0) {
      await db.bulkDocs(deletions as unknown as PouchDB.Core.PutDocument<Record<string, unknown>>[]);
    }
  }

  /**
   * Get all entries sorted by creation date (newest first).
   */
  async getAllEntriesSorted<T>(): Promise<T[]> {
    const db = await this.init();
    const result = await db.query('entries/by_createdAt', {
      include_docs: true,
      descending: true,
    });
    return result.rows
      .filter((r) => r.doc)
      .map((r) => this.toModel<T>(r.doc as PouchDoc));
  }

  // ────────────────────── Attachments ──────────────────────

  /**
   * Store a binary attachment on a document.
   * @param storeName — document type prefix (e.g. 'entry')
   * @param id — document uuid
   * @param attachmentName — attachment name (e.g. 'image-<uuid>')
   * @param blob — binary data
   * @param contentType — MIME type
   */
  async putAttachment(
    storeName: string,
    id: string,
    attachmentName: string,
    blob: Blob,
    contentType: string
  ): Promise<void> {
    const db = await this.init();
    const docId = buildId(storeName as StoreType, id);
    const doc = await db.get(docId);
    await db.putAttachment(docId, attachmentName, doc._rev, blob, contentType);
  }

  /**
   * Retrieve a binary attachment from a document.
   * PouchDB returns a Buffer in Node.js environments and a Blob in browsers.
   * We normalise to Blob for a consistent API.
   */
  async getAttachment(
    storeName: string,
    id: string,
    attachmentName: string
  ): Promise<Blob> {
    const db = await this.init();
    const docId = buildId(storeName as StoreType, id);
    const attachment = await db.getAttachment(docId, attachmentName);
    // In browsers PouchDB returns a Blob directly
    if (attachment instanceof Blob) {
      return attachment;
    }
    // In Node.js test environments PouchDB returns a Buffer.
    // Convert via ArrayBuffer for type-safe Blob creation.
    const raw = attachment as unknown as ArrayBufferLike;
    return new Blob([new Uint8Array(raw as ArrayBuffer)]);
  }

  /**
   * Remove a binary attachment from a document.
   */
  async removeAttachment(
    storeName: string,
    id: string,
    attachmentName: string
  ): Promise<void> {
    const db = await this.init();
    const docId = buildId(storeName as StoreType, id);
    const doc = await db.get(docId);
    await db.removeAttachment(docId, attachmentName, doc._rev);
  }

  /**
   * Return the underlying PouchDB instance (for advanced consumers
   * such as sync or change-feed listeners).
   */
  async getDb(): Promise<PouchDB.Database> {
    return this.init();
  }

  /**
   * Destroy the database (used in tests).
   */
  async destroy(): Promise<void> {
    const db = await this.init();
    await db.destroy();
    this.db = null;
    this.initPromise = null;
  }
}

// Export singleton instance
export const dbService = new DBService();
export { STORES };

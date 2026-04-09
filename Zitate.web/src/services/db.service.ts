/**
 * PouchDB Service - Wrapper for database operations.
 *
 * Replaces the previous idb-based IndexedDB wrapper.
 * Public API is kept compatible: callers pass a storeName (type prefix)
 * and data objects that carry an `id` field.  Internally the service
 * maps them to PouchDB documents with `_id = <type>:<uuid>` and a
 * `type` field.
 */
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import { DB_NAME, DB_VERSION, STORES, type StoreType, buildId, extractUuid, getDesignDocuments } from '../db/schema';

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

        // Future migration hooks go here:
        // if (storedVersion < 2) { await migrateV1toV2(db); }

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

  // ────────────────────── helpers ──────────────────────

  /**
   * Convert an internal PouchDB document back to the public model shape.
   * Strips `_id`, `_rev`, `type` and restores `id`.
   */
  private toModel<T>(doc: PouchDoc): T {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _rev, type, ...rest } = doc;
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
   */
  async update<T>(storeName: string, data: T): Promise<string> {
    const db = await this.init();
    const doc = this.toDoc(storeName, data as unknown as HasId);
    try {
      const existing = await db.get(doc._id);
      doc._rev = existing._rev;
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
      image: 'images',
      audio: 'audio',
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

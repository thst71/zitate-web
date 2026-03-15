/**
 * IndexedDB Service - Wrapper for database operations
 */
import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORES, handleUpgrade } from '../db/schema';

class DBService {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<IDBPDatabase> | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        const event = {
          target: { result: db },
          oldVersion,
          newVersion,
        } as unknown as IDBVersionChangeEvent;
        handleUpgrade(event);
      },
    });

    this.db = await this.initPromise;
    return this.db;
  }

  /**
   * Get a single item by ID
   */
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.init();
    return db.get(storeName, id);
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return db.getAll(storeName);
  }

  /**
   * Add a new item
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init();
    return db.add(storeName, data);
  }

  /**
   * Update an existing item
   */
  async update<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.init();
    return db.put(storeName, data);
  }

  /**
   * Delete an item by ID
   */
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return db.delete(storeName, id);
  }

  /**
   * Query items by index
   */
  async query<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readonly');
    const index = tx.objectStore(storeName).index(indexName);
    return index.getAll(value);
  }

  /**
   * Count items in a store
   */
  async count(storeName: string): Promise<number> {
    const db = await this.init();
    return db.count(storeName);
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return db.clear(storeName);
  }

  /**
   * Get all entries sorted by creation date (newest first)
   */
  async getAllEntriesSorted<T>(): Promise<T[]> {
    const db = await this.init();
    const tx = db.transaction(STORES.ENTRIES, 'readonly');
    const store = tx.objectStore(STORES.ENTRIES);
    const index = store.index('createdAt');

    // Get all entries via cursor for sorting
    const entries: T[] = [];
    let cursor = await index.openCursor(null, 'prev'); // 'prev' for descending order

    while (cursor) {
      entries.push(cursor.value);
      cursor = await cursor.continue();
    }

    return entries;
  }
}

// Export singleton instance
export const dbService = new DBService();
export { STORES };

/**
 * IndexedDB Schema Definition for Zitate
 * Database: zitate-db
 * Version: 1
 */

export const DB_NAME = 'zitate-db';
export const DB_VERSION = 1;

/**
 * Object store names
 */
export const STORES = {
  ENTRIES: 'entries',
  AUTHORS: 'authors',
  LABELS: 'labels',
  IMAGES: 'images',
  AUDIO: 'audio',
  FOLDERS: 'folders',
} as const;

/**
 * Initialize IndexedDB schema
 */
export function createSchema(db: IDBDatabase): void {
  // Entries object store
  if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
    const entryStore = db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
    entryStore.createIndex('createdAt', 'createdAt', { unique: false });
    entryStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    entryStore.createIndex('latitude', 'latitude', { unique: false });
    entryStore.createIndex('longitude', 'longitude', { unique: false });
  }

  // Authors object store
  if (!db.objectStoreNames.contains(STORES.AUTHORS)) {
    const authorStore = db.createObjectStore(STORES.AUTHORS, { keyPath: 'id' });
    authorStore.createIndex('name', 'name', { unique: true });
  }

  // Labels object store
  if (!db.objectStoreNames.contains(STORES.LABELS)) {
    const labelStore = db.createObjectStore(STORES.LABELS, { keyPath: 'id' });
    labelStore.createIndex('name', 'name', { unique: true });
  }

  // Images object store
  if (!db.objectStoreNames.contains(STORES.IMAGES)) {
    const imageStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
    imageStore.createIndex('entryId', 'entryId', { unique: false });
    imageStore.createIndex('order', 'order', { unique: false });
  }

  // Audio object store
  if (!db.objectStoreNames.contains(STORES.AUDIO)) {
    const audioStore = db.createObjectStore(STORES.AUDIO, { keyPath: 'id' });
    audioStore.createIndex('entryId', 'entryId', { unique: false });
  }

  // Folders object store
  if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
    const folderStore = db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
    folderStore.createIndex('order', 'order', { unique: false });
  }
}

/**
 * Handle database upgrade
 */
export function handleUpgrade(event: IDBVersionChangeEvent): void {
  const db = (event.target as IDBOpenDBRequest).result;

  // Version 1: Initial schema
  if (event.oldVersion < 1) {
    createSchema(db);
  }

  // Future migrations would go here:
  // if (event.oldVersion < 2) { ... }
}

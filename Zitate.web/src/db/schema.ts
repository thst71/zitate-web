/**
 * PouchDB Schema Definition for Zitate
 * Documents use a type field and <type>:<uuid> ID pattern.
 *
 * DB_VERSION tracks the document schema version.  It is stored on a
 * dedicated `_local/schema_version` document inside PouchDB and used by:
 *  - the design-document installer (to detect when views must be refreshed)
 *  - the export service (to tag export files for forward-compatibility checks)
 *  - future migration logic (to upgrade documents when the schema evolves)
 *
 * Bump DB_VERSION whenever:
 *  - a document model gains / loses / renames a field
 *  - a design-document view function changes
 *  - the export format changes
 */
export const DB_VERSION = 2;

export const DB_NAME = 'zitate-db';

/**
 * Document type prefixes used in PouchDB _id fields.
 * IDs follow the pattern: "<type>:<uuid>"
 */
export const STORES = {
  ENTRIES: 'entry',
  AUTHORS: 'author',
  LABELS: 'label',
  IMAGES: 'image',
  AUDIO: 'audio',
  FOLDERS: 'folder',
} as const;

export type StoreType = typeof STORES[keyof typeof STORES];

/**
 * Build a PouchDB document _id from type prefix and uuid.
 */
export function buildId(type: StoreType, uuid: string): string {
  return `${type}:${uuid}`;
}

/**
 * Extract the uuid portion from a PouchDB _id.
 */
export function extractUuid(docId: string): string {
  const idx = docId.indexOf(':');
  return idx >= 0 ? docId.substring(idx + 1) : docId;
}

/**
 * Extract the type prefix from a PouchDB _id.
 */
export function extractType(docId: string): string {
  const idx = docId.indexOf(':');
  return idx >= 0 ? docId.substring(0, idx) : docId;
}

/**
 * Create design documents for secondary indexes.
 * These are installed once on database initialisation.
 */
export function getDesignDocuments(): Array<{ _id: string; views: Record<string, { map: string }> }> {
  return [
    {
      _id: '_design/entries',
      views: {
        by_createdAt: {
          map: "function(doc) { if (doc.type === 'entry') emit(doc.createdAt); }",
        },
        by_authorId: {
          map: "function(doc) { if (doc.type === 'entry' && doc.authorId) emit(doc.authorId); }",
        },
      },
    },
    {
      _id: '_design/images',
      views: {
        by_entryId: {
          map: "function(doc) { if (doc.type === 'image') emit(doc.entryId); }",
        },
      },
    },
    {
      _id: '_design/audio',
      views: {
        by_entryId: {
          map: "function(doc) { if (doc.type === 'audio') emit(doc.entryId); }",
        },
      },
    },
    {
      _id: '_design/authors',
      views: {
        by_name: {
          map: "function(doc) { if (doc.type === 'author') emit(doc.name); }",
        },
      },
    },
    {
      _id: '_design/labels',
      views: {
        by_name: {
          map: "function(doc) { if (doc.type === 'label') emit(doc.name); }",
        },
      },
    },
    {
      _id: '_design/folders',
      views: {
        by_name: {
          map: "function(doc) { if (doc.type === 'folder') emit(doc.name); }",
        },
        by_order: {
          map: "function(doc) { if (doc.type === 'folder') emit(doc.order); }",
        },
      },
    },
  ];
}

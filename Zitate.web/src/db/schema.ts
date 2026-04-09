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
 *
 * Version history:
 *  1 — initial PouchDB migration from idb
 *  2 — added citationDate and links fields on entries
 *  3 — images/audio stored as PouchDB attachments on entry documents
 */
export const DB_VERSION = 3;

export const DB_NAME = 'zitate-db';

/**
 * Document type prefixes used in PouchDB _id fields.
 * IDs follow the pattern: "<type>:<uuid>"
 *
 * Since v3, images and audio are stored as PouchDB attachments on entry
 * documents. The legacy `image` and `audio` type prefixes are only used
 * during migration from v2 → v3.
 */
export const STORES = {
  ENTRIES: 'entry',
  AUTHORS: 'author',
  LABELS: 'label',
  FOLDERS: 'folder',
} as const;

/**
 * Legacy store prefixes — only used by the v2→v3 migration.
 */
export const LEGACY_STORES = {
  IMAGES: 'image',
  AUDIO: 'audio',
} as const;

export type StoreType = typeof STORES[keyof typeof STORES] | typeof LEGACY_STORES[keyof typeof LEGACY_STORES];

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

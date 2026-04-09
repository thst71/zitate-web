/**
 * ImageAttachment interfaces
 *
 * ImageAttachmentMeta — metadata stored on the Entry document (no blob).
 * ImageAttachmentWithBlob — runtime type combining metadata with loaded blob.
 */

/** Metadata for an image attachment, persisted on the Entry document. */
export interface ImageAttachmentMeta {
  id: string;                    // UUID v4 (also the PouchDB attachment name: `image-<id>`)
  mimeType: string;              // image/jpeg, image/png, etc.
  size: number;                  // Bytes (max 2MB after compression)
  order: number;                 // Display order (0-based)
  createdAt: number;             // Unix timestamp (ms)
}

/** Runtime type: metadata + loaded blob for UI components. */
export interface ImageAttachmentWithBlob extends ImageAttachmentMeta {
  blob: Blob;
}

/**
 * @deprecated Use ImageAttachmentMeta (persistence) or ImageAttachmentWithBlob (runtime).
 * Kept for backward-compatible import handling of legacy export files.
 */
export interface ImageAttachment {
  id: string;
  entryId: string;
  blob: Blob;
  mimeType: string;
  size: number;
  order: number;
  createdAt: number;
}


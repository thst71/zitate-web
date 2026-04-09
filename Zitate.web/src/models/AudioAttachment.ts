/**
 * AudioAttachment interfaces
 *
 * AudioAttachmentMeta — metadata stored on the Entry document (no blob).
 * AudioAttachmentWithBlob — runtime type combining metadata with loaded blob.
 */

/** Metadata for an audio attachment, persisted on the Entry document. */
export interface AudioAttachmentMeta {
  id: string;                    // UUID v4 (PouchDB attachment name: `audio-<id>`)
  mimeType: string;              // audio/webm, audio/ogg, etc.
  duration: number;              // Seconds (max 300)
  createdAt: number;             // Unix timestamp (ms)
}

/** Runtime type: metadata + loaded blob for UI components. */
export interface AudioAttachmentWithBlob extends AudioAttachmentMeta {
  blob: Blob;
}

/**
 * @deprecated Use AudioAttachmentMeta (persistence) or AudioAttachmentWithBlob (runtime).
 * Kept for backward-compatible import handling of legacy export files.
 */
export interface AudioAttachment {
  id: string;
  entryId: string;
  blob: Blob;
  mimeType: string;
  duration: number;
  createdAt: number;
}


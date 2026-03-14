/**
 * ImageAttachment interface - represents an image attached to an entry
 */
export interface ImageAttachment {
  id: string;                    // UUID v4
  entryId: string;               // Foreign key to Entry
  blob: Blob;                    // Image data
  mimeType: string;              // image/jpeg, image/png, etc.
  size: number;                  // Bytes (max 2MB)
  order: number;                 // Display order (0-9)
  createdAt: number;             // Unix timestamp (ms)
}

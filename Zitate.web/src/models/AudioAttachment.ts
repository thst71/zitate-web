/**
 * AudioAttachment interface - represents an audio recording attached to an entry
 */
export interface AudioAttachment {
  id: string;                    // UUID v4
  entryId: string;               // Foreign key to Entry
  blob: Blob;                    // Audio data
  mimeType: string;              // audio/webm, audio/ogg, etc.
  duration: number;              // Seconds (max 300)
  createdAt: number;             // Unix timestamp (ms)
}

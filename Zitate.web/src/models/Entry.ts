/**
 * Entry interface - represents a quote/citation with metadata
 */
import type { ImageAttachmentMeta } from './ImageAttachment';
import type { AudioAttachmentMeta } from './AudioAttachment';

export interface EntryLink {
  id: string;                    // UUID v4
  url: string;                   // Absolute URL
  addedAt: number;               // Unix timestamp (ms)
}

export interface Entry {
  id: string;                    // UUID v4
  text: string;                  // 1-10,000 characters
  citationDate?: number;         // Unix timestamp (ms) for when the quote was said/published
  latitude?: number;             // WGS84 coordinates
  longitude?: number;            // WGS84 coordinates
  addressShort?: string;         // Short geocoded name, e.g. "Alexanderplatz, Berlin"
  addressFull?: string;          // Full geocoded address from Nominatim
  authorId?: string;             // Foreign key to Author
  labelIds: string[];            // Foreign keys to Labels
  links?: EntryLink[];           // Attached URLs with metadata
  imageAttachments: ImageAttachmentMeta[];  // Image metadata (blobs stored as PouchDB attachments)
  audioAttachment?: AudioAttachmentMeta;    // Audio metadata (blob stored as PouchDB attachment)
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
}

/**
 * Create a new Entry with defaults
 */
export function createEntry(text: string, latitude?: number, longitude?: number): Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    text,
    citationDate: Date.now(), // Default to creation time
    latitude,
    longitude,
    labelIds: [],
    links: [],
    imageAttachments: [],
  };
}

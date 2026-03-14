/**
 * Entry interface - represents a quote/citation with metadata
 */
export interface Entry {
  id: string;                    // UUID v4
  text: string;                  // 1-10,000 characters
  latitude?: number;             // WGS84 coordinates
  longitude?: number;            // WGS84 coordinates
  authorId?: string;             // Foreign key to Author
  labelIds: string[];            // Foreign keys to Labels
  imageIds: string[];            // Foreign keys to Images
  audioId?: string;              // Foreign key to Audio
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
}

/**
 * Create a new Entry with defaults
 */
export function createEntry(text: string, latitude?: number, longitude?: number): Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    text,
    latitude,
    longitude,
    labelIds: [],
    imageIds: [],
  };
}

/**
 * Label interface - represents a tag/category
 */
export interface Label {
  id: string;                    // UUID v4
  name: string;                  // Required, unique, lowercase, max 50 chars
}

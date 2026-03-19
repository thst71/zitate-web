/**
 * SmartFolder interface - represents a dynamic folder with search criteria
 */
export interface SmartFolder {
  id: string;                    // UUID v4
  name: string;                  // Max 100 chars
  criteria: FolderCriteria;      // Search criteria
  order: number;                 // User-defined order
  createdAt: number;             // Unix timestamp (ms)
}

/**
 * FolderCriteria - defines the search rules for a smart folder
 */
export interface FolderCriteria {
  labels?: {
    values: string[];            // Label IDs
    operator: 'AND' | 'OR';
  };
  authorId?: string;
  dateRange?: {
    start?: number;              // Unix timestamp (ms)
    end?: number;                // Unix timestamp (ms)
  };
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  hasLocation?: boolean;         // Filter by presence/absence of location
  textMatch?: string;
}

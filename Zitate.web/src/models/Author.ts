/**
 * Author interface - represents a quote author
 */
export interface Author {
  id: string;                    // UUID v4
  name: string;                  // Required, unique, max 200 chars
  dateOfBirth?: number;          // Unix timestamp (ms)
  locationOfBirth?: string;      // Max 200 chars
  dateOfDeath?: number;          // Unix timestamp (ms)
  wikipediaURL?: string;         // URL string
}

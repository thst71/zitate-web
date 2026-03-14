/**
 * Validation utilities for Zitate
 */

export type ValidationResult =
  | { isValid: true }
  | { isValid: false; error: string };

/**
 * Constants for validation
 */
export const VALIDATION_LIMITS = {
  TEXT_MIN: 1,
  TEXT_MAX: 10000,
  AUTHOR_NAME_MAX: 200,
  LABEL_NAME_MAX: 50,
  FOLDER_NAME_MAX: 100,
  LOCATION_MAX: 200,
} as const;

/**
 * Validate entry text
 */
export function validateEntryText(text: string | undefined | null): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (text.length < VALIDATION_LIMITS.TEXT_MIN) {
    return { isValid: false, error: `Text must be at least ${VALIDATION_LIMITS.TEXT_MIN} character` };
  }

  if (text.length > VALIDATION_LIMITS.TEXT_MAX) {
    return { isValid: false, error: `Text cannot exceed ${VALIDATION_LIMITS.TEXT_MAX} characters` };
  }

  return { isValid: true };
}

/**
 * Validate author name
 */
export function validateAuthorName(name: string | undefined | null): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Author name cannot be empty' };
  }

  if (name.length > VALIDATION_LIMITS.AUTHOR_NAME_MAX) {
    return { isValid: false, error: `Author name cannot exceed ${VALIDATION_LIMITS.AUTHOR_NAME_MAX} characters` };
  }

  return { isValid: true };
}

/**
 * Validate label name
 */
export function validateLabelName(name: string | undefined | null): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Label name cannot be empty' };
  }

  if (name.length > VALIDATION_LIMITS.LABEL_NAME_MAX) {
    return { isValid: false, error: `Label name cannot exceed ${VALIDATION_LIMITS.LABEL_NAME_MAX} characters` };
  }

  // Check for disallowed characters
  if (name.includes(',') || name.includes(';')) {
    return { isValid: false, error: 'Label name cannot contain commas or semicolons' };
  }

  return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string | undefined | null): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { isValid: true }; // URL is optional
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate folder name
 */
export function validateFolderName(name: string | undefined | null): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Folder name cannot be empty' };
  }

  if (name.length > VALIDATION_LIMITS.FOLDER_NAME_MAX) {
    return { isValid: false, error: `Folder name cannot exceed ${VALIDATION_LIMITS.FOLDER_NAME_MAX} characters` };
  }

  return { isValid: true };
}

/**
 * Normalize label name (lowercase)
 */
export function normalizeLabelName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Format label for display (capitalize first letter)
 */
export function formatLabelForDisplay(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

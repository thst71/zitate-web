/**
 * Image Service - Handles image compression and processing
 */
import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  quality: 0.8,
};

/**
 * Compress an image file to reduce its size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const compressedFile = await imageCompression(file, mergedOptions);
    return compressedFile;
  } catch (error) {
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate image file type
 * @param file - File to validate
 * @returns true if valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Validate image file size (before compression)
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns true if file size is within limit
 */
export function isValidImageSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Create object URL from Blob for preview
 * @param blob - Image blob
 * @returns Object URL
 */
export function createImageURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 * @param url - Object URL to revoke
 */
export function revokeImageURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Read file as data URL for preview
 * @param file - File to read
 * @returns Promise resolving to data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

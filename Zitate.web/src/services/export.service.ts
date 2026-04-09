import type { Entry, Author, Label, SmartFolder, ImageAttachment, AudioAttachment } from '../models';
import { DB_VERSION, STORES } from '../db/schema';

export interface ExportData {
  version: number;
  exportedAt: number;
  entries: Entry[];
  authors: Author[];
  labels: Label[];
  folders: SmartFolder[];
  media: {
    images: { id: string; entryId: string; data: string; mimeType: string; order: number; createdAt: number }[];
    audio: { id: string; entryId: string; data: string; mimeType: string; duration: number; createdAt: number }[];
  };
}

export interface ImportOptions {
  strategy: 'merge' | 'replace';
  includeMedia: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    entries: number;
    authors: number;
    labels: number;
    folders: number;
    images: number;
    audio: number;
  };
}

class ExportService {

  async exportAllData(): Promise<Blob> {
    try {
      // Import db service dynamically to avoid circular dependencies
      const { dbService } = await import('./db.service');
      
      // Get all data from IndexedDB
      const [entries, authors, labels, folders] = await Promise.all([
        dbService.getAll<Entry>(STORES.ENTRIES),
        dbService.getAll<Author>(STORES.AUTHORS),
        dbService.getAll<Label>(STORES.LABELS),
        dbService.getAll<SmartFolder>(STORES.FOLDERS)
      ]);

      // Get all images and convert to base64
      const images = await dbService.getAll<ImageAttachment>(STORES.IMAGES);
      const imagesData = await Promise.all(
        images.map(async (image) => ({
          id: image.id,
          entryId: image.entryId,
          data: await this.blobToBase64(image.blob),
          mimeType: image.mimeType,
          order: image.order,
          createdAt: image.createdAt
        }))
      );

      // Get all audio and convert to base64
      const audio = await dbService.getAll<AudioAttachment>(STORES.AUDIO);
      const audioData = await Promise.all(
        audio.map(async (audioItem) => ({
          id: audioItem.id,
          entryId: audioItem.entryId,
          data: await this.blobToBase64(audioItem.blob),
          mimeType: audioItem.mimeType,
          duration: audioItem.duration,
          createdAt: audioItem.createdAt
        }))
      );

      const exportData: ExportData = {
        version: DB_VERSION,
        exportedAt: Date.now(),
        entries,
        authors,
        labels,
        folders,
        media: {
          images: imagesData,
          audio: audioData
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  }

  async importData(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const jsonText = await file.text();
      const importData: ExportData = JSON.parse(jsonText);
      
      // Validate import data
      const validation = this.validateImportData(importData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Invalid import file format'
        };
      }

      const { dbService } = await import('./db.service');

      if (options.strategy === 'replace') {
        // Clear existing data
        await this.clearAllData();
      }

      const stats = {
        entries: 0,
        authors: 0,
        labels: 0,
        folders: 0,
        images: 0,
        audio: 0
      };

      // Import authors first (entries reference them)
      for (const author of importData.authors) {
        if (options.strategy === 'merge') {
          const existing = await dbService.query(STORES.AUTHORS, 'name', author.name);
          if (existing.length === 0) {
            await dbService.add(STORES.AUTHORS, author);
            stats.authors++;
          }
        } else {
          await dbService.add(STORES.AUTHORS, author);
          stats.authors++;
        }
      }

      // Import labels
      for (const label of importData.labels) {
        if (options.strategy === 'merge') {
          const existing = await dbService.query(STORES.LABELS, 'name', label.name);
          if (existing.length === 0) {
            await dbService.add(STORES.LABELS, label);
            stats.labels++;
          }
        } else {
          await dbService.add(STORES.LABELS, label);
          stats.labels++;
        }
      }

      // Import media if requested
      if (options.includeMedia) {
        for (const image of importData.media.images) {
          const blob = this.base64ToBlob(image.data, image.mimeType);
          const imageRecord = {
            id: image.id,
            entryId: image.entryId,
            blob,
            mimeType: image.mimeType,
            order: image.order,
            createdAt: image.createdAt
          };
          await dbService.add(STORES.IMAGES, imageRecord);
          stats.images++;
        }

        for (const audioItem of importData.media.audio) {
          const blob = this.base64ToBlob(audioItem.data, audioItem.mimeType);
          const audioRecord = {
            id: audioItem.id,
            entryId: audioItem.entryId,
            blob,
            mimeType: audioItem.mimeType,
            duration: audioItem.duration,
            createdAt: audioItem.createdAt
          };
          await dbService.add(STORES.AUDIO, audioRecord);
          stats.audio++;
        }
      }

      // Import entries
      for (const entry of importData.entries) {
        if (options.strategy === 'merge') {
          await dbService.add(STORES.ENTRIES, { ...entry, id: this.generateId() });
        } else {
          await dbService.add(STORES.ENTRIES, entry);
        }
        stats.entries++;
      }

      // Import folders
      for (const folder of importData.folders) {
        if (options.strategy === 'merge') {
          const existing = await dbService.query(STORES.FOLDERS, 'name', folder.name);
          if (existing.length === 0) {
            await dbService.add(STORES.FOLDERS, folder);
            stats.folders++;
          }
        } else {
          await dbService.add(STORES.FOLDERS, folder);
          stats.folders++;
        }
      }

      return {
        success: true,
        message: `Successfully imported ${stats.entries} entries, ${stats.authors} authors, ${stats.labels} labels, and ${stats.folders} folders.`,
        stats
      };

    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import data. Please check the file format.'
      };
    }
  }

  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private validateImportData(data: unknown): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid file format' };
    }

    const record = data as Record<string, unknown>;

    if (!record.version || typeof record.version !== 'number') {
      return { isValid: false, error: 'Missing or invalid version' };
    }

    if (record.version > DB_VERSION) {
      return { isValid: false, error: 'File was exported from a newer version of the app' };
    }

    const requiredFields = ['entries', 'authors', 'labels', 'folders'];
    for (const field of requiredFields) {
      if (!Array.isArray(record[field])) {
        return { isValid: false, error: `Missing or invalid ${field} data` };
      }
    }

      const entries = record.entries as Array<Record<string, unknown>>;
      for (const entry of entries) {
        if (entry.links !== undefined) {
          if (!Array.isArray(entry.links)) {
            return { isValid: false, error: 'Invalid entry link metadata' };
          }

          for (const link of entry.links as Array<Record<string, unknown>>) {
            if (
              !link ||
              typeof link !== 'object' ||
              typeof link.id !== 'string' ||
              typeof link.url !== 'string' ||
              typeof link.addedAt !== 'number'
            ) {
              return { isValid: false, error: 'Malformed URL attachment metadata' };
            }
          }
        }
      }

    return { isValid: true };
  }

  private async clearAllData() {
    const { dbService } = await import('./db.service');
    
    const stores = [STORES.ENTRIES, STORES.AUTHORS, STORES.LABELS, STORES.FOLDERS, STORES.IMAGES, STORES.AUDIO];
    for (const store of stores) {
      const items = await dbService.getAll(store);
      for (const item of items) {
        await dbService.delete(store, (item as { id: string }).id);
      }
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:type/subtype;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private generateId(): string {
    return crypto.randomUUID?.() || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const exportService = new ExportService();

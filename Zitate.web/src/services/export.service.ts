import type {
  Entry,
  Author,
  Label,
  SmartFolder,
  ImageAttachment,
  AudioAttachment,
} from "../models";
import { remapEntry, remapFolder, type IdMaps } from "./importRemap";

export interface ExportData {
  version: number;
  exportedAt: number;
  entries: Entry[];
  authors: Author[];
  labels: Label[];
  folders: SmartFolder[];
  media: {
    images: {
      id: string;
      entryId: string;
      data: string;
      mimeType: string;
      order: number;
      createdAt: number;
    }[];
    audio: {
      id: string;
      entryId: string;
      data: string;
      mimeType: string;
      duration: number;
      createdAt: number;
    }[];
  };
}

export interface ImportOptions {
  strategy: "merge" | "replace";
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

type ImportStore =
  | "authors"
  | "labels"
  | "images"
  | "audio"
  | "entries"
  | "folders";

interface ImportPlan {
  records: {
    authors: Author[];
    labels: Label[];
    images: Omit<ImageAttachment, "size">[];
    audio: AudioAttachment[];
    entries: Entry[];
    folders: SmartFolder[];
  };
  mediaWithoutEntry: number;
}

class ExportService {
  private static readonly CURRENT_VERSION = 1;

  async exportAllData(): Promise<Blob> {
    try {
      // Import db service dynamically to avoid circular dependencies
      const { dbService } = await import("./db.service");

      // Get all data from IndexedDB
      const [entries, authors, labels, folders] = await Promise.all([
        dbService.getAll<Entry>("entries"),
        dbService.getAll<Author>("authors"),
        dbService.getAll<Label>("labels"),
        dbService.getAll<SmartFolder>("folders"),
      ]);

      // Get all images and convert to base64
      const images = await dbService.getAll<ImageAttachment>("images");
      const imagesData = await Promise.all(
        images.map(async (image) => ({
          id: image.id,
          entryId: image.entryId,
          data: await this.blobToBase64(image.blob),
          mimeType: image.mimeType,
          order: image.order,
          createdAt: image.createdAt,
        })),
      );

      // Get all audio and convert to base64
      const audio = await dbService.getAll<AudioAttachment>("audio");
      const audioData = await Promise.all(
        audio.map(async (audioItem) => ({
          id: audioItem.id,
          entryId: audioItem.entryId,
          data: await this.blobToBase64(audioItem.blob),
          mimeType: audioItem.mimeType,
          duration: audioItem.duration,
          createdAt: audioItem.createdAt,
        })),
      );

      const exportData: ExportData = {
        version: ExportService.CURRENT_VERSION,
        exportedAt: Date.now(),
        entries,
        authors,
        labels,
        folders,
        media: {
          images: imagesData,
          audio: audioData,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: "application/json" });
    } catch (error) {
      console.error("Export failed:", error);
      throw new Error("Failed to export data. Please try again.");
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
          message: validation.error || "Invalid import file format",
        };
      }

      const { dbService } = await import("./db.service");
      const plan = await this.planImport(importData, options);

      // One transaction over all stores: a failed write leaves the database as it was,
      // including the clearing of a replace. Only IndexedDB requests are awaited inside it.
      const stores = Object.keys(plan.records) as ImportStore[];
      const tx = await dbService.transaction(stores, "readwrite");
      const requests: Promise<unknown>[] = [];
      let failure: unknown;
      try {
        if (options.strategy === "replace") {
          for (const store of stores) {
            requests.push(tx.objectStore(store).clear());
          }
        }
        for (const store of stores) {
          for (const record of plan.records[store]) {
            requests.push(tx.objectStore(store).add(record));
          }
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
      // Settle every request, so that none of them rejects unobserved after an abort
      const settled = await Promise.allSettled([...requests, tx.done]);
      const rejected = settled.find((r) => r.status === "rejected");
      if (failure !== undefined || rejected) {
        throw failure ?? (rejected as PromiseRejectedResult).reason;
      }

      const stats = {
        entries: plan.records.entries.length,
        authors: plan.records.authors.length,
        labels: plan.records.labels.length,
        folders: plan.records.folders.length,
        images: plan.records.images.length,
        audio: plan.records.audio.length,
      };
      const left = plan.mediaWithoutEntry;
      return {
        success: true,
        message:
          `Successfully imported ${stats.entries} entries, ${stats.authors} authors, ${stats.labels} labels, and ${stats.folders} folders.` +
          (left === 1
            ? " 1 media item without its entry was left out."
            : left > 1
              ? ` ${left} media items without their entries were left out.`
              : ""),
        stats,
      };
    } catch (error) {
      console.error("Import failed:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to import data. Please check the file format.",
      };
    }
  }

  /**
   * Prepares every record of an import, without writing: new ids and mapped references for a
   * merge, decoded media. Reads the existing authors, labels and folders for a merge.
   */
  private async planImport(
    importData: ExportData,
    options: ImportOptions,
  ): Promise<ImportPlan> {
    const { dbService } = await import("./db.service");
    const merging = options.strategy === "merge";

    // Exported id -> local id; a skipped author or label maps to the existing one
    const maps: IdMaps = {
      authors: new Map(),
      labels: new Map(),
      images: new Map(),
      audio: new Map(),
    };
    const records: ImportPlan["records"] = {
      authors: [],
      labels: [],
      images: [],
      audio: [],
      entries: [],
      folders: [],
    };

    // Authors and labels: a merge skips those whose name exists, locally or earlier in the file
    const byName = async (store: "authors" | "labels") =>
      merging
        ? new Map(
            (await dbService.getAll<Author | Label>(store)).map((r) => [
              r.name,
              r.id,
            ]),
          )
        : new Map<string, string>();
    const authorIds = await byName("authors");
    for (const author of importData.authors) {
      const existing = authorIds.get(author.name);
      if (existing !== undefined) {
        maps.authors.set(author.id, existing);
      } else {
        records.authors.push(author);
        if (merging) authorIds.set(author.name, author.id);
      }
    }
    const labelIds = await byName("labels");
    for (const label of importData.labels) {
      const existing = labelIds.get(label.name);
      if (existing !== undefined) {
        maps.labels.set(label.id, existing);
      } else {
        records.labels.push(label);
        if (merging) labelIds.set(label.name, label.id);
      }
    }

    // A merge adds every entry and its media under new ids
    const entryIds = new Map(
      importData.entries.map((entry) => [
        entry.id,
        merging ? this.generateId() : entry.id,
      ]),
    );
    let mediaWithoutEntry = 0;

    if (options.includeMedia) {
      for (const image of importData.media.images) {
        const entryId = entryIds.get(image.entryId);
        if (merging && entryId === undefined) {
          mediaWithoutEntry++;
          continue;
        }
        const id = merging ? this.generateId() : image.id;
        maps.images.set(image.id, id);
        records.images.push({
          id,
          entryId: entryId ?? image.entryId,
          blob: this.base64ToBlob(image.data, image.mimeType),
          mimeType: image.mimeType,
          order: image.order,
          createdAt: image.createdAt,
        });
      }

      for (const audioItem of importData.media.audio) {
        const entryId = entryIds.get(audioItem.entryId);
        if (merging && entryId === undefined) {
          mediaWithoutEntry++;
          continue;
        }
        const id = merging ? this.generateId() : audioItem.id;
        maps.audio.set(audioItem.id, id);
        records.audio.push({
          id,
          entryId: entryId ?? audioItem.entryId,
          blob: this.base64ToBlob(audioItem.data, audioItem.mimeType),
          mimeType: audioItem.mimeType,
          duration: audioItem.duration,
          createdAt: audioItem.createdAt,
        });
      }
    }

    for (const entry of importData.entries) {
      records.entries.push(
        merging
          ? {
              ...remapEntry(entry, maps),
              id: entryIds.get(entry.id) ?? this.generateId(),
            }
          : entry,
      );
    }

    // Folders: a merge skips those whose name exists; the folders store has no name index
    const folderNames = new Set(
      merging
        ? (await dbService.getAll<SmartFolder>("folders")).map((f) => f.name)
        : [],
    );
    for (const folder of importData.folders) {
      if (merging) {
        if (folderNames.has(folder.name)) continue;
        folderNames.add(folder.name);
        records.folders.push(remapFolder(folder, maps));
      } else {
        records.folders.push(folder);
      }
    }

    return { records, mediaWithoutEntry };
  }

  downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private validateImportData(data: unknown): {
    isValid: boolean;
    error?: string;
  } {
    if (!data || typeof data !== "object") {
      return { isValid: false, error: "Invalid file format" };
    }

    const record = data as Record<string, unknown>;

    if (!record.version || typeof record.version !== "number") {
      return { isValid: false, error: "Missing or invalid version" };
    }

    if (record.version > ExportService.CURRENT_VERSION) {
      return {
        isValid: false,
        error: "File was exported from a newer version of the app",
      };
    }

    const requiredFields = ["entries", "authors", "labels", "folders"];
    for (const field of requiredFields) {
      if (!Array.isArray(record[field])) {
        return { isValid: false, error: `Missing or invalid ${field} data` };
      }
    }

    const entries = record.entries as Array<Record<string, unknown>>;
    for (const entry of entries) {
      if (entry.links !== undefined) {
        if (!Array.isArray(entry.links)) {
          return { isValid: false, error: "Invalid entry link metadata" };
        }

        for (const link of entry.links as Array<Record<string, unknown>>) {
          if (
            !link ||
            typeof link !== "object" ||
            typeof link.id !== "string" ||
            typeof link.url !== "string" ||
            typeof link.addedAt !== "number"
          ) {
            return {
              isValid: false,
              error: "Malformed URL attachment metadata",
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Remove data:type/subtype;base64, prefix
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64"));
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
    return (
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }
}

export const exportService = new ExportService();

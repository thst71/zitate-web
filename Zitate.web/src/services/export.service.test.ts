import { describe, it, expect, beforeEach } from "vitest";
import { exportService, type ExportData } from "./export.service";
import { dbService } from "./db.service";
import { STORES } from "../db/schema";
import type { Entry, SmartFolder } from "../models";

function backup(data: Partial<ExportData>): File {
  const full: ExportData = {
    version: 1,
    exportedAt: 0,
    entries: [],
    authors: [],
    labels: [],
    folders: [],
    media: { images: [], audio: [] },
    ...data,
  };
  return new File([JSON.stringify(full)], "backup.json", {
    type: "application/json",
  });
}

function entry(id: string, extra: Partial<Entry> = {}): Entry {
  return {
    id,
    text: `Quote ${id}`,
    labelIds: [],
    imageIds: [],
    links: [],
    createdAt: 1,
    updatedAt: 1,
    ...extra,
  };
}

function folder(id: string, name: string, extra: Partial<SmartFolder> = {}) {
  return { id, name, criteria: {}, order: 0, createdAt: 1, ...extra };
}

function image(id: string, entryId: string, order = 0) {
  const data = btoa("hello");
  return { id, entryId, data, mimeType: "image/png", order, createdAt: 1 };
}

function audio(id: string, entryId: string) {
  const data = btoa("hello");
  return {
    id,
    entryId,
    data,
    mimeType: "audio/webm",
    duration: 3,
    createdAt: 1,
  };
}

const merge = { strategy: "merge", includeMedia: true } as const;
const replace = { strategy: "replace", includeMedia: true } as const;

async function readBlob(blob: Blob): Promise<ExportData> {
  return JSON.parse(await new File([blob], "export.json").text());
}

// fake-indexeddb cannot clone jsdom's Blobs, so stored media lose their content in these
// tests: the export of media is not testable here, and imported media are checked by their
// metadata.
describe("ExportService.exportAllData", () => {
  beforeEach(async () => {
    for (const store of Object.values(STORES)) {
      await dbService.clear(store);
    }
  });

  it("exports all stores", async () => {
    await dbService.add("entries", entry("e1"));
    await dbService.add("authors", { id: "a1", name: "Goethe" });
    await dbService.add("labels", { id: "l1", name: "love" });
    await dbService.add("folders", folder("f1", "Love"));

    const data = await readBlob(await exportService.exportAllData());

    expect(data.version).toBe(1);
    expect(data.entries).toEqual([entry("e1")]);
    expect(data.authors).toEqual([{ id: "a1", name: "Goethe" }]);
    expect(data.labels).toEqual([{ id: "l1", name: "love" }]);
    expect(data.folders).toEqual([folder("f1", "Love")]);
    expect(data.media).toEqual({ images: [], audio: [] });
  });

  it("restores an export on replace", async () => {
    await dbService.add("entries", entry("e1"));
    await dbService.add("authors", { id: "a1", name: "Goethe" });
    const exported = await exportService.exportAllData();
    await dbService.clear("entries");
    await dbService.clear("authors");

    const result = await exportService.importData(
      new File([exported], "backup.json"),
      replace,
    );

    expect(result.success).toBe(true);
    expect(await dbService.getAll("entries")).toEqual([entry("e1")]);
    expect(await dbService.getAll("authors")).toEqual([
      { id: "a1", name: "Goethe" },
    ]);
  });

  it("imports media from Base64 on replace", async () => {
    const result = await exportService.importData(
      backup({
        entries: [entry("e1", { imageIds: ["i1"] })],
        media: {
          images: [image("i1", "e1")],
          audio: [audio("s1", "e1")],
        },
      }),
      replace,
    );

    expect(result.stats).toMatchObject({ images: 1, audio: 1 });
    expect(await dbService.get("images", "i1")).toMatchObject({
      entryId: "e1",
      mimeType: "image/png",
      order: 0,
    });
    expect(await dbService.get("audio", "s1")).toMatchObject({
      entryId: "e1",
      mimeType: "audio/webm",
      duration: 3,
    });
  });
});

describe("ExportService.importData validation", () => {
  const invalid = async (content: string) =>
    exportService.importData(new File([content], "backup.json"), merge);

  it.each([
    ["no object", "42", "Invalid file format"],
    [
      "no version",
      JSON.stringify({ entries: [] }),
      "Missing or invalid version",
    ],
    [
      "a newer version",
      JSON.stringify({ version: 99 }),
      "File was exported from a newer version of the app",
    ],
    [
      "missing folders",
      JSON.stringify({ version: 1, entries: [], authors: [], labels: [] }),
      "Missing or invalid folders data",
    ],
    [
      "links that are no array",
      JSON.stringify({
        version: 1,
        entries: [{ id: "e1", links: "x" }],
        authors: [],
        labels: [],
        folders: [],
      }),
      "Invalid entry link metadata",
    ],
    [
      "a malformed link",
      JSON.stringify({
        version: 1,
        entries: [{ id: "e1", links: [{ id: "k1", url: 5, addedAt: 1 }] }],
        authors: [],
        labels: [],
        folders: [],
      }),
      "Malformed URL attachment metadata",
    ],
  ])("rejects %s", async (_case, content, message) => {
    const result = await invalid(content);
    expect(result).toEqual({ success: false, message });
  });

  it("rejects text that is no JSON", async () => {
    const result = await invalid("not json");
    expect(result.success).toBe(false);
  });
});

describe("ExportService.importData", () => {
  beforeEach(async () => {
    for (const store of Object.values(STORES)) {
      await dbService.clear(store);
    }
  });

  describe("smart folders", () => {
    it("merges a folder into an empty database", async () => {
      const result = await exportService.importData(
        backup({ entries: [entry("e1")], folders: [folder("f1", "Love")] }),
        merge,
      );

      expect(result.success).toBe(true);
      expect(result.stats?.folders).toBe(1);
      const folders = await dbService.getAll<SmartFolder>("folders");
      expect(folders).toEqual([folder("f1", "Love")]);
    });

    it("skips a folder whose name exists and keeps the existing one", async () => {
      const existing = folder("f-local", "Love", { order: 3 });
      await dbService.add("folders", existing);

      const result = await exportService.importData(
        backup({ folders: [folder("f1", "Love", { order: 0 })] }),
        merge,
      );

      expect(result.success).toBe(true);
      expect(result.stats?.folders).toBe(0);
      expect(await dbService.getAll("folders")).toEqual([existing]);
    });

    it("adds a folder with a new name next to existing ones", async () => {
      await dbService.add("folders", folder("f-local", "Love"));

      const result = await exportService.importData(
        backup({ folders: [folder("f1", "Wisdom", { order: 2 })] }),
        merge,
      );

      expect(result.stats?.folders).toBe(1);
      const stored = await dbService.get<SmartFolder>("folders", "f1");
      expect(stored).toEqual(folder("f1", "Wisdom", { order: 2 }));
    });

    it("stores all folders on replace", async () => {
      await dbService.add("folders", folder("f-local", "Old"));

      const result = await exportService.importData(
        backup({ folders: [folder("f1", "Love"), folder("f2", "Wisdom")] }),
        replace,
      );

      expect(result.stats?.folders).toBe(2);
      const ids = (await dbService.getAll<SmartFolder>("folders")).map(
        (f) => f.id,
      );
      expect(ids.sort()).toEqual(["f1", "f2"]);
    });
  });
});

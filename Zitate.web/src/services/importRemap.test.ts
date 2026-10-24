import { describe, it, expect } from "vitest";
import { remapEntry, remapFolder, type IdMaps } from "./importRemap";
import type { Entry, SmartFolder } from "../models";

const maps: IdMaps = {
  authors: new Map([["a-file", "a-local"]]),
  labels: new Map([["l-file", "l-local"]]),
  images: new Map([["i1", "i1-new"]]),
  audio: new Map([["s1", "s1-new"]]),
};

const entry: Entry = {
  id: "e1",
  text: "Quote",
  authorId: "a-file",
  labelIds: ["l-file", "l-new"],
  imageIds: ["i1"],
  links: [],
  createdAt: 1,
  updatedAt: 2,
};

describe("remapEntry", () => {
  it("replaces mapped author and label ids", () => {
    const result = remapEntry(entry, maps);
    expect(result.authorId).toBe("a-local");
    expect(result.labelIds).toEqual(["l-local", "l-new"]);
  });

  it("keeps unmapped ids and all other fields", () => {
    const result = remapEntry({ ...entry, authorId: "a-new" }, maps);
    expect(result).toEqual({
      ...entry,
      authorId: "a-new",
      labelIds: ["l-local", "l-new"],
      imageIds: ["i1-new"],
    });
  });

  it("leaves an entry without author without author", () => {
    const withoutAuthor: Entry = { ...entry, authorId: undefined };
    expect(remapEntry(withoutAuthor, maps).authorId).toBeUndefined();
  });

  it("does not change its input", () => {
    remapEntry(entry, maps);
    expect(entry.authorId).toBe("a-file");
    expect(entry.labelIds).toEqual(["l-file", "l-new"]);
  });
});

describe("remapEntry with media", () => {
  it("replaces mapped image ids in order and the audio id", () => {
    const result = remapEntry(
      { ...entry, imageIds: ["i1", "i2"], audioId: "s1" },
      maps,
    );
    expect(result.imageIds).toEqual(["i1-new", "i2"]);
    expect(result.audioId).toBe("s1-new");
  });

  it("leaves an entry without audio without audio", () => {
    expect(remapEntry(entry, maps).audioId).toBeUndefined();
  });
});

describe("remapFolder", () => {
  const folder: SmartFolder = {
    id: "f1",
    name: "Goethe on love",
    criteria: {
      authorId: "a-file",
      labels: { values: ["l-file", "l-new"], operator: "AND" },
      textMatch: "love",
    },
    order: 0,
    createdAt: 1,
  };

  it("replaces mapped ids in the criteria and keeps the rest", () => {
    expect(remapFolder(folder, maps)).toEqual({
      ...folder,
      criteria: {
        authorId: "a-local",
        labels: { values: ["l-local", "l-new"], operator: "AND" },
        textMatch: "love",
      },
    });
  });

  it("leaves criteria without author and labels unchanged", () => {
    const plain = { ...folder, criteria: { textMatch: "love" } };
    expect(remapFolder(plain, maps)).toEqual(plain);
  });
});

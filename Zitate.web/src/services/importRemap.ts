/**
 * Import remapping - rewrites the references of imported records from the ids of the backup to
 * the ids they get in the local database (e.g. an existing author of the same name)
 */
import type { Entry, SmartFolder } from "../models";

/** Exported id -> local id, per kind of record */
export interface IdMaps {
  authors: Map<string, string>;
  labels: Map<string, string>;
  images: Map<string, string>;
  audio: Map<string, string>;
}

const mapId = (map: Map<string, string>, id: string): string =>
  map.get(id) ?? id;

/**
 * Entry with its author, labels, images and audio mapped; unmapped ids stay as they are
 */
export function remapEntry(entry: Entry, maps: IdMaps): Entry {
  return {
    ...entry,
    ...(entry.authorId !== undefined && {
      authorId: mapId(maps.authors, entry.authorId),
    }),
    labelIds: entry.labelIds.map((id) => mapId(maps.labels, id)),
    imageIds: entry.imageIds.map((id) => mapId(maps.images, id)),
    ...(entry.audioId !== undefined && {
      audioId: mapId(maps.audio, entry.audioId),
    }),
  };
}

/**
 * Folder with the author and labels of its criteria mapped
 */
export function remapFolder(folder: SmartFolder, maps: IdMaps): SmartFolder {
  const { authorId, labels } = folder.criteria;
  return {
    ...folder,
    criteria: {
      ...folder.criteria,
      ...(authorId !== undefined && {
        authorId: mapId(maps.authors, authorId),
      }),
      ...(labels !== undefined && {
        labels: {
          ...labels,
          values: labels.values.map((id) => mapId(maps.labels, id)),
        },
      }),
    },
  };
}

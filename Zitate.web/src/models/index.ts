/**
 * Export all model interfaces
 */
export type { Entry, EntryLink } from './Entry';
export type { Author } from './Author';
export type { Label } from './Label';
export type { ImageAttachmentMeta, ImageAttachmentWithBlob, ImageAttachment } from './ImageAttachment';
export type { AudioAttachmentMeta, AudioAttachmentWithBlob, AudioAttachment } from './AudioAttachment';
export type { SmartFolder, FolderCriteria } from './SmartFolder';

export { createEntry } from './Entry';

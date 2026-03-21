import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFolders } from './useFolders';
import type { Entry, SmartFolder } from '../models';
import { dbService, STORES } from '../services/db.service';

vi.mock('../services/db.service', () => ({
  dbService: {
    getAll: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  STORES: {
    ENTRIES: 'entries',
    AUTHORS: 'authors',
    LABELS: 'labels',
    IMAGES: 'images',
    AUDIO: 'audio',
    FOLDERS: 'folders',
  }
}));

describe('useFolders', () => {
  const mockFolders: SmartFolder[] = [
    {
      id: '1',
      name: 'Work Folder',
      criteria: { labels: { values: ['label-1'], operator: 'OR' } },
      order: 0,
      createdAt: new Date('2024-01-01').valueOf(),
    },
    {
      id: '2',
      name: 'Personal Folder',
      criteria: { authorId: 'author-1' },
      order: 1,
      createdAt: new Date('2024-01-02').valueOf(),
    },
  ];

  const mockEntries: Entry[] = [
    {
      id: 'entry-1',
      text: 'Work entry',
      authorId: 'author-1',
      labelIds: ['label-1'],
      imageIds: [],
      createdAt: new Date('2024-01-01').valueOf(),
      updatedAt: new Date('2024-01-01').valueOf(),
    },
    {
      id: 'entry-2',
      text: 'Personal entry',
      authorId: 'author-1',
      labelIds: ['label-2'],
      imageIds: [],
      createdAt: new Date('2024-01-02').valueOf(),
      updatedAt: new Date('2024-01-02').valueOf(),
    },
    {
      id: 'entry-3',
      text: 'Entry with location',
      latitude: 40.7128,
      longitude: -74.0060,
      labelIds: [],
      imageIds: [],
      createdAt: new Date('2024-01-03').valueOf(),
      updatedAt: new Date('2024-01-03').valueOf(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbService.getAll).mockResolvedValue(mockFolders);
    vi.mocked(dbService.add).mockResolvedValue('mocked-id');
    vi.mocked(dbService.update).mockResolvedValue('mocked-id');
    vi.mocked(dbService.delete).mockResolvedValue(undefined);
  });

  it('should load folders on mount', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });
  });

  it('should add a new folder', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    await act(async () => {
      const folder = await result.current.addFolder('New Folder', { 
        labels: { values: ['label-3'], operator: 'OR' } 
      });
      expect(folder.name).toBe('New Folder');
      expect(folder.criteria).toEqual({ 
        labels: { values: ['label-3'], operator: 'OR' } 
      });
    });

    expect(dbService.add).toHaveBeenCalledWith(STORES.FOLDERS, expect.objectContaining({
      name: 'New Folder',
      criteria: { labels: { values: ['label-3'], operator: 'OR' } }
    }));
  });

  it('should delete a folder', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    await act(async () => {
      await result.current.deleteFolder('1');
    });

    expect(dbService.delete).toHaveBeenCalledWith(STORES.FOLDERS, '1');

    await waitFor(() => {
      expect(result.current.folders).toHaveLength(1);
      expect(result.current.folders.find((f) => f.id === '1')).toBeUndefined();
    });
  });

  it('should filter entries by label criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { labels: { values: ['label-1'], operator: 'OR' } },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-1');
  });

  it('should filter entries by author criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { authorId: 'author-1' },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2']);
  });

  it('should filter entries by location criteria (has location)', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { location: { latitude: 0, longitude: 0, radiusKm: 10 } },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-3');
  });


  it('should filter entries by text content criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { textMatch: 'work' },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-1');
  });

  it('should filter entries by date range criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: {
        dateRange: {
          start: new Date('2024-01-02').getTime(),
          end: new Date('2024-01-03').getTime(),
        },
      },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-2', 'entry-3']);
  });

  it('should filter entries by multiple criteria (AND logic)', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      order: 0,
      criteria: {
        authorId: 'author-1',
        labels: { values: ['label-1'], operator: 'OR' },
      },
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-1');
  });

  it('should return correct folder count', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    // Note: Folders are sorted alphabetically by name in useFolders hook
    // "Personal Folder" comes before "Work Folder", so the order is:
    // result.current.folders[0] = Personal Folder (authorId: 'author-1')
    // result.current.folders[1] = Work Folder (labels: ['label-1'])

    const count1 = result.current.getFolderCount(mockEntries, result.current.folders[0]); 
    expect(count1).toBe(2); // Personal Folder: entry-1 and entry-2 have author-1

    const count2 = result.current.getFolderCount(mockEntries, result.current.folders[1]);
    expect(count2).toBe(1); // Work Folder: Only entry-1 has label-1
  });

  it('should handle empty criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: {},
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toEqual(mockEntries); // No criteria means all entries pass
  });

  it('should handle validation error when adding folder', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    await expect(result.current.addFolder('', {})).rejects.toThrow('Folder name cannot be empty');
  });

  it('should be case-insensitive when filtering by text', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { textMatch: 'WORK' },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-1');
  });

  it('should filter by date range with only dateFrom', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: {
        dateRange: {
          start: new Date('2024-01-02').getTime(),
        },
      },
      createdAt: new Date().valueOf(),
      order: 0
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-2', 'entry-3']);
  });

  it('should filter by date range with only dateTo', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: {
        dateRange: {
          end: new Date('2024-01-02').getTime(),
        },
      },
      order: 0,
      createdAt: new Date().valueOf(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2']);
  });
});

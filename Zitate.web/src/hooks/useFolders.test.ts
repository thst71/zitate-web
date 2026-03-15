import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFolders } from './useFolders';
import type { Entry, SmartFolder } from '../models';
import * as dbService from '../services/db.service';

vi.mock('../services/db.service');

describe('useFolders', () => {
  const mockFolders: SmartFolder[] = [
    {
      id: '1',
      name: 'Work Folder',
      criteria: { labelIds: ['label-1'] },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Personal Folder',
      criteria: { authorId: 'author-1' },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockEntries: Entry[] = [
    {
      id: 'entry-1',
      text: 'Work entry',
      authorId: 'author-1',
      labelIds: ['label-1'],
      imageIds: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'entry-2',
      text: 'Personal entry',
      authorId: 'author-1',
      labelIds: ['label-2'],
      imageIds: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'entry-3',
      text: 'Entry with location',
      latitude: 40.7128,
      longitude: -74.006,
      labelIds: [],
      imageIds: [],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbService.getAllFolders).mockResolvedValue(mockFolders);
  });

  it('should load folders on mount', async () => {
    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });
  });

  it('should add a new folder', async () => {
    const newFolder: SmartFolder = {
      id: '3',
      name: 'New Folder',
      criteria: { labelIds: ['label-3'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(dbService.createFolder).mockResolvedValue(newFolder);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    await act(async () => {
      await result.current.addFolder('New Folder', { labelIds: ['label-3'] });
    });

    expect(dbService.createFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Folder',
        criteria: { labelIds: ['label-3'] },
      })
    );

    await waitFor(() => {
      expect(result.current.folders).toHaveLength(3);
      expect(result.current.folders[2]).toEqual(newFolder);
    });
  });

  it('should delete a folder', async () => {
    vi.mocked(dbService.deleteFolder).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFolders());

    await waitFor(() => {
      expect(result.current.folders).toEqual(mockFolders);
    });

    await act(async () => {
      await result.current.deleteFolder('1');
    });

    expect(dbService.deleteFolder).toHaveBeenCalledWith('1');

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
      criteria: { labelIds: ['label-1'] },
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      criteria: { hasLocation: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('entry-3');
  });

  it('should filter entries by location criteria (no location)', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { hasLocation: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2']);
  });

  it('should filter entries by text content criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { textContains: 'work' },
      createdAt: new Date(),
      updatedAt: new Date(),
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
        dateFrom: new Date('2024-01-02'),
        dateTo: new Date('2024-01-03'),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
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
      criteria: {
        authorId: 'author-1',
        labelIds: ['label-1'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
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

    const count1 = result.current.getFolderCount(mockEntries, mockFolders[0]);
    expect(count1).toBe(1); // Only entry-1 has label-1

    const count2 = result.current.getFolderCount(mockEntries, mockFolders[1]);
    expect(count2).toBe(2); // entry-1 and entry-2 have author-1
  });

  it('should handle empty criteria', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toEqual(mockEntries); // No criteria means all entries pass
  });

  it('should handle validation error when adding folder', async () => {
    const { result } = renderHook(() => useFolders());

    await expect(result.current.addFolder('', {})).rejects.toThrow();
  });

  it('should be case-insensitive when filtering by text', () => {
    const { result } = renderHook(() => useFolders());

    const folder: SmartFolder = {
      id: '1',
      name: 'Test',
      criteria: { textContains: 'WORK' },
      createdAt: new Date(),
      updatedAt: new Date(),
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
        dateFrom: new Date('2024-01-02'),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
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
        dateTo: new Date('2024-01-02'),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filtered = result.current.filterByFolder(mockEntries, folder);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['entry-1', 'entry-2']);
  });
});

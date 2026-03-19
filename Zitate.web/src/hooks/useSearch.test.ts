import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearch } from './useSearch';
import type { Entry } from '../models';

// Mock the dependencies
vi.mock('./useAuthors', () => ({
  useAuthors: () => ({
    getAuthorById: (id: string) => {
      const authors: Record<string, { id: string; name: string }> = {
        'author-1': { id: 'author-1', name: 'John Doe' },
        'author-2': { id: 'author-2', name: 'Jane Smith' },
      };
      return authors[id];
    },
  }),
}));

vi.mock('./useLabels', () => ({
  useLabels: () => ({
    getLabelsByIds: (ids: string[]) => {
      const labels: Record<string, { id: string; name: string }> = {
        'label-1': { id: 'label-1', name: 'important' },
        'label-2': { id: 'label-2', name: 'work' },
        'label-3': { id: 'label-3', name: 'personal' },
      };
      return ids.map((id) => labels[id]).filter(Boolean);
    },
  }),
}));

describe('useSearch', () => {
  const mockEntries: Entry[] = [
    {
      id: '1',
      text: 'First entry about programming',
      authorId: 'author-1',
      labelIds: ['label-1', 'label-2'],
      imageIds: [],
      createdAt: new Date('2024-01-01').valueOf(),
      updatedAt: new Date('2024-01-01').valueOf(),
    },
    {
      id: '2',
      text: 'Second entry about design',
      authorId: 'author-2',
      labelIds: ['label-3'],
      imageIds: [],
      createdAt: new Date('2024-01-02').valueOf(),
      updatedAt: new Date('2024-01-02').valueOf(),
    },
    {
      id: '3',
      text: 'Third entry with no author',
      labelIds: [],
      imageIds: [],
      createdAt: new Date('2024-01-03').valueOf(),
      updatedAt: new Date('2024-01-03').valueOf(),
    },
  ];

  it('should return all entries when search query is empty', () => {
    const { result } = renderHook(() => useSearch(mockEntries));
    expect(result.current.filteredEntries).toEqual(mockEntries);
    expect(result.current.isSearching).toBe(false);
  });

  it('should filter entries by text content', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('programming');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('1');
    expect(result.current.isSearching).toBe(true);
  });

  it('should be case-insensitive when searching text', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('DESIGN');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('2');
  });

  it('should filter entries by author name', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('John Doe');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('1');
  });

  it('should be case-insensitive when searching author name', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('jane smith');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('2');
  });

  it('should filter entries by label name', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('work');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('1');
  });

  it('should be case-insensitive when searching label name', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('PERSONAL');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('2');
  });

  it('should return multiple matches when search matches multiple entries', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('entry');
    });

    expect(result.current.filteredEntries).toHaveLength(3);
  });

  it('should trim whitespace from search query', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('  programming  ');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('1');
  });

  it('should return empty array when no matches found', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('nonexistent');
    });

    expect(result.current.filteredEntries).toHaveLength(0);
    expect(result.current.isSearching).toBe(true);
  });

  it('should update filteredEntries when search query changes', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('programming');
    });
    expect(result.current.filteredEntries).toHaveLength(1);

    act(() => {
      result.current.handleSearch('design');
    });
    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('2');
  });

  it('should update filteredEntries when entries change', () => {
    const { result, rerender } = renderHook(
      ({ entries }) => useSearch(entries),
      { initialProps: { entries: mockEntries } }
    );

    act(() => {
      result.current.handleSearch('programming');
    });
    expect(result.current.filteredEntries).toHaveLength(1);

    const newEntries: Entry[] = [
      ...mockEntries,
      {
        id: '4',
        text: 'Another programming entry',
        labelIds: [],
        imageIds: [],
        createdAt: new Date('2024-01-04').valueOf(),
        updatedAt: new Date('2024-01-04').valueOf(),
      },
    ];

    rerender({ entries: newEntries });

    expect(result.current.filteredEntries).toHaveLength(2);
  });

  it('should clear search results when search query becomes empty', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('programming');
    });
    expect(result.current.isSearching).toBe(true);
    expect(result.current.filteredEntries).toHaveLength(1);

    act(() => {
      result.current.handleSearch('');
    });
    expect(result.current.isSearching).toBe(false);
    expect(result.current.filteredEntries).toEqual(mockEntries);
  });

  it('should handle entries with no author or labels', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('Third');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('3');
  });

  it('should match partial text in entry content', () => {
    const { result } = renderHook(() => useSearch(mockEntries));

    act(() => {
      result.current.handleSearch('prog');
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].id).toBe('1');
  });
});

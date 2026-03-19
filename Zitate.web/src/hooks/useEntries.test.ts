import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntries } from './useEntries';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

describe('useEntries', () => {
  beforeEach(async () => {
    // Clear entries before each test
    const all = await dbService.getAll(STORES.ENTRIES);
    for (const item of all) {
      await dbService.delete(STORES.ENTRIES, (item as { id: string }).id);
    }
  });

  it('should initialize with empty entries array', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load existing entries', async () => {
    // Add test entries
    const testEntries = [
      {
        id: 'entry-1',
        text: 'Test entry 1',
        labelIds: [],
        imageIds: [],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
      {
        id: 'entry-2',
        text: 'Test entry 2',
        labelIds: [],
        imageIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const entry of testEntries) {
      await dbService.add(STORES.ENTRIES, entry);
    }

    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].text).toBe('Test entry 2'); // Newest first
    expect(result.current.entries[1].text).toBe('Test entry 1');
  });

  it('should add a new entry without location', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('New entry text');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('New entry text');
    expect(result.current.entries[0].latitude).toBeUndefined();
    expect(result.current.entries[0].longitude).toBeUndefined();
  });

  it('should add a new entry with location', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry with location', 52.52, 13.405);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('Entry with location');
    expect(result.current.entries[0].latitude).toBe(52.52);
    expect(result.current.entries[0].longitude).toBe(13.405);
  });

  it('should delete an entry', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('Entry to delete');
    });

    const entryId = result.current.entries[0].id;

    await act(async () => {
      await result.current.deleteEntry(entryId);
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it('should allow adding entry with any text (validation happens at form level)', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Hook allows any text - validation is done at form level
    await act(async () => {
      await result.current.addEntry('Valid text');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('Valid text');
  });

  it('should reload entries', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add entry directly to DB (bypassing hook)
    await dbService.add(STORES.ENTRIES, {
      id: 'external-entry',
      text: 'External entry',
      labelIds: [],
      imageIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Reload should pick up the new entry
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe('External entry');
  });

  it('should maintain sort order (newest first)', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addEntry('First entry');
    });

    await act(async () => {
      await result.current.addEntry('Second entry');
    });

    await act(async () => {
      await result.current.addEntry('Third entry');
    });

    expect(result.current.entries).toHaveLength(3);
    expect(result.current.entries[0].text).toBe('Third entry');
    expect(result.current.entries[1].text).toBe('Second entry');
    expect(result.current.entries[2].text).toBe('First entry');
  });

  it('should handle partial location data correctly', async () => {
    const { result } = renderHook(() => useEntries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add with only latitude (should treat as no location)
    await act(async () => {
      await result.current.addEntry('Entry', 52.52, undefined);
    });

    const entry = result.current.entries[0];
    expect(entry.latitude).toBe(52.52);
    expect(entry.longitude).toBeUndefined();
  });
});

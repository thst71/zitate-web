import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuthors } from './useAuthors';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

describe('useAuthors', () => {
  beforeEach(async () => {
    // Clear authors before each test
    const all = await dbService.getAll(STORES.AUTHORS);
    for (const item of all) {
      await dbService.delete(STORES.AUTHORS, (item as any).id);
    }
  });

  it('should initialize with empty authors array', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.authors).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should add a new author', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('Albert Einstein');
    });

    expect(result.current.authors).toHaveLength(1);
    expect(result.current.authors[0].name).toBe('Albert Einstein');
  });

  it('should reject duplicate author names (case-insensitive)', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('John Doe');
    });

    await expect(
      act(async () => {
        await result.current.addAuthor('john doe');
      })
    ).rejects.toThrow('An author with this name already exists');
  });

  it('should update an existing author', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('Original Name');
    });

    const authorId = result.current.authors[0].id;

    await act(async () => {
      await result.current.updateAuthor(authorId, 'Updated Name');
    });

    expect(result.current.authors[0].name).toBe('Updated Name');
  });

  it('should delete an author', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('To Delete');
    });

    const authorId = result.current.authors[0].id;

    await act(async () => {
      await result.current.deleteAuthor(authorId);
    });

    expect(result.current.authors).toHaveLength(0);
  });

  it('should get author by ID', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('Test Author');
    });

    const authorId = result.current.authors[0].id;
    const author = result.current.getAuthorById(authorId);

    expect(author).toBeDefined();
    expect(author?.name).toBe('Test Author');
  });

  it('should sort authors alphabetically', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addAuthor('Zebra');
      await result.current.addAuthor('Apple');
      await result.current.addAuthor('Banana');
    });

    expect(result.current.authors[0].name).toBe('Apple');
    expect(result.current.authors[1].name).toBe('Banana');
    expect(result.current.authors[2].name).toBe('Zebra');
  });

  it('should validate author name length', async () => {
    const { result } = renderHook(() => useAuthors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const longName = 'a'.repeat(201);

    await expect(
      act(async () => {
        await result.current.addAuthor(longName);
      })
    ).rejects.toThrow();
  });
});

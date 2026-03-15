import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLabels } from './useLabels';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

describe('useLabels', () => {
  beforeEach(async () => {
    // Clear labels before each test
    const all = await dbService.getAll(STORES.LABELS);
    for (const item of all) {
      await dbService.delete(STORES.LABELS, (item as any).id);
    }
  });

  it('should initialize with empty labels array', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.labels).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should add a new label', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addLabel('Important');
    });

    expect(result.current.labels).toHaveLength(1);
    expect(result.current.labels[0].name).toBe('important'); // Lowercase
  });

  it('should return existing label instead of creating duplicate', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let label1;
    await act(async () => {
      label1 = await result.current.addLabel('test');
    });

    let label2;
    await act(async () => {
      label2 = await result.current.addLabel('TEST'); // Different case
    });

    expect(result.current.labels).toHaveLength(1);
    expect(label1.id).toBe(label2.id);
  });

  it('should delete a label', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addLabel('ToDelete');
    });

    const labelId = result.current.labels[0].id;

    await act(async () => {
      await result.current.deleteLabel(labelId);
    });

    expect(result.current.labels).toHaveLength(0);
  });

  it('should get labels by IDs', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addLabel('Label1');
      await result.current.addLabel('Label2');
      await result.current.addLabel('Label3');
    });

    const ids = [result.current.labels[0].id, result.current.labels[2].id];
    const selectedLabels = result.current.getLabelsByIds(ids);

    expect(selectedLabels).toHaveLength(2);
    expect(selectedLabels.map(l => l.name)).toContain('label1');
    expect(selectedLabels.map(l => l.name)).toContain('label3');
  });

  it('should search labels by prefix', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addLabel('Important');
      await result.current.addLabel('Inspiration');
      await result.current.addLabel('Test');
    });

    const matches = result.current.searchLabels('imp');

    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('important');
  });

  it('should sort labels alphabetically', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addLabel('Zebra');
      await result.current.addLabel('Apple');
      await result.current.addLabel('Banana');
    });

    expect(result.current.labels[0].name).toBe('apple');
    expect(result.current.labels[1].name).toBe('banana');
    expect(result.current.labels[2].name).toBe('zebra');
  });

  it('should reject labels with commas or semicolons', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addLabel('test,label');
      })
    ).rejects.toThrow();
  });

  it('should validate label name length', async () => {
    const { result } = renderHook(() => useLabels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const longName = 'a'.repeat(51);

    await expect(
      act(async () => {
        await result.current.addLabel(longName);
      })
    ).rejects.toThrow();
  });
});

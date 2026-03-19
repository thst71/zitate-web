import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial'));
    expect(result.current).toBe('initial');
  });

  it('should debounce string values with default delay', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'first' },
    });

    expect(result.current).toBe('first');

    // Update the value
    rerender({ value: 'second' });

    // Should still show old value immediately
    expect(result.current).toBe('first');

    // After 300ms, should show new value
    await waitFor(() => expect(result.current).toBe('second'), { timeout: 500 });
  });

  it('should debounce number values', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 1 },
    });

    expect(result.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    await waitFor(() => expect(result.current).toBe(2), { timeout: 400 });
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    expect(result.current).toBe('first');

    await waitFor(() => expect(result.current).toBe('second'), { timeout: 200 });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    // Rapidly change values
    rerender({ value: 'second' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    rerender({ value: 'third' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    rerender({ value: 'fourth' });

    // Should still show first value
    expect(result.current).toBe('first');

    // After 300ms from last change, should show final value
    await waitFor(() => expect(result.current).toBe('fourth'), { timeout: 500 });
  });

  it('should handle object values', async () => {
    const obj1 = { id: 1, name: 'first' };
    const obj2 = { id: 2, name: 'second' };

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: obj1 },
    });

    expect(result.current).toBe(obj1);

    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);

    await waitFor(() => expect(result.current).toBe(obj2), { timeout: 400 });
  });

  it('should handle array values', async () => {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: arr1 },
    });

    expect(result.current).toBe(arr1);

    rerender({ value: arr2 });
    expect(result.current).toBe(arr1);

    await waitFor(() => expect(result.current).toBe(arr2), { timeout: 400 });
  });

  it('should handle boolean values', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: false },
    });

    expect(result.current).toBe(false);

    rerender({ value: true });
    expect(result.current).toBe(false);

    await waitFor(() => expect(result.current).toBe(true), { timeout: 400 });
  });
});

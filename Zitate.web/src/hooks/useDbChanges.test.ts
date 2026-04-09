import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDbChanges } from './useDbChanges';
import { dbService } from '../services/db.service';
import { STORES } from '../db/schema';

describe('useDbChanges', () => {
  beforeEach(async () => {
    await dbService.init();
    for (const store of Object.values(STORES)) {
      await dbService.clear(store);
    }
  });

  it('should invoke onChange when a matching document is added', async () => {
    let callCount = 0;
    const onChange = () => { callCount++; };

    renderHook(() => useDbChanges(STORES.ENTRIES, onChange));

    // Allow the change feed to subscribe (async db.getDb + since: 'now')
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Add a document — should trigger the change listener
    await act(async () => {
      await dbService.add(STORES.ENTRIES, {
        id: 'change-test-1',
        text: 'Hello',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  it('should not invoke onChange for a different document type', async () => {
    let callCount = 0;
    const onChange = () => { callCount++; };

    renderHook(() => useDbChanges(STORES.AUTHORS, onChange));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Add an entry (not an author) — should NOT trigger
    await act(async () => {
      await dbService.add(STORES.ENTRIES, {
        id: 'change-test-2',
        text: 'Entry',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Give some time for any potential false trigger
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(callCount).toBe(0);
  });

  it('should invoke onChange on document update', async () => {
    // Pre-create a document
    await dbService.add(STORES.ENTRIES, {
      id: 'change-test-3',
      text: 'Original',
      labelIds: [],
      imageAttachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let callCount = 0;
    const onChange = () => { callCount++; };

    renderHook(() => useDbChanges(STORES.ENTRIES, onChange));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Update the document
    await act(async () => {
      await dbService.update(STORES.ENTRIES, {
        id: 'change-test-3',
        text: 'Updated',
        labelIds: [],
        imageAttachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  it('should invoke onChange on document deletion', async () => {
    await dbService.add(STORES.ENTRIES, {
      id: 'change-test-4',
      text: 'To delete',
      labelIds: [],
      imageAttachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let callCount = 0;
    const onChange = () => { callCount++; };

    renderHook(() => useDbChanges(STORES.ENTRIES, onChange));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await act(async () => {
      await dbService.delete(STORES.ENTRIES, 'change-test-4');
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  it('should stop listening after unmount', async () => {
    let callCount = 0;
    const onChange = () => { callCount++; };

    const { unmount } = renderHook(() => useDbChanges(STORES.ENTRIES, onChange));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    unmount();

    // Add a document after unmount — should NOT trigger
    await dbService.add(STORES.ENTRIES, {
      id: 'change-test-5',
      text: 'After unmount',
      labelIds: [],
      imageAttachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(callCount).toBe(0);
  });
});


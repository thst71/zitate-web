/**
 * Simple store invalidation mechanism.
 * When a hook mutates data, it emits an event so other instances of the same
 * hook can reload from IndexedDB. The emitting listener is excluded to avoid
 * redundant self-reloads.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

/**
 * Subscribe to invalidation events for a given store.
 * Returns an unsubscribe function.
 */
export function onStoreChange(store: string, listener: Listener): () => void {
  if (!listeners.has(store)) {
    listeners.set(store, new Set());
  }
  listeners.get(store)!.add(listener);
  return () => {
    listeners.get(store)?.delete(listener);
  };
}


/**
 * Notify all listeners (except the emitting one) that a store has changed.
 * Pass the caller's own reload function to exclude it.
 */
export function emitStoreChange(store: string, self?: Listener): void {
  listeners.get(store)?.forEach((fn) => {
    if (fn !== self) {
      fn();
    }
  });
}


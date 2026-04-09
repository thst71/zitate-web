/**
 * useDbChanges hook — Subscribes to PouchDB's live change feed and invokes
 * a callback when documents of a specific type are created, updated or deleted.
 *
 * Replaces the custom storeSync event emitter so that hooks are notified
 * of changes from both local writes *and* future remote replication.
 */
import { useEffect, useRef } from 'react';
import { dbService } from '../services/db.service';
import { extractType } from '../db/schema';

/**
 * Subscribe to PouchDB changes for documents whose `_id` starts with
 * the given type prefix (e.g. `'entry'`, `'author'`).
 *
 * The listener fires for every matching change *after* subscription
 * (uses `since: 'now'`).  It does **not** fire for the initial load —
 * the consuming hook is expected to call its own load function on mount.
 *
 * @param docType — document type prefix to filter on
 * @param onChange — callback invoked when a matching change occurs
 */
export function useDbChanges(docType: string, onChange: () => void): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let changes: PouchDB.Core.Changes<Record<string, unknown>> | null = null;

    (async () => {
      const db = await dbService.getDb();
      if (cancelled) return;

      changes = db.changes({
        since: 'now',
        live: true,
        include_docs: false,
      }).on('change', (change) => {
        if (extractType(change.id) === docType) {
          onChangeRef.current();
        }
      });
    })();

    return () => {
      cancelled = true;
      if (changes) {
        changes.cancel();
      }
    };
  }, [docType]);
}


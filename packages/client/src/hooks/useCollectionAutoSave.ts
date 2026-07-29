import { useCallback, useEffect, useRef } from "react";

import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/**
 * Callback-style persist matching TanStack's `mutate(vars, { onSuccess, onError })` shape. The hook
 * stores it in a ref and reads the latest closure at fire time, so callers may pass an inline
 * function capturing render-scoped data (e.g. the latest loaded entity).
 */
export type PersistCollection<TValue> = (
  value: TValue,
  callbacks: { onSuccess: () => void;
    onError: (error: Error) => void; },
) => void;

interface UseCollectionAutoSaveParams<TValue> {
  /** Identity of the edited entity. Switching ids re-seeds the saved snapshot. */
  id: string;
  /** Section label naming the toast ("Updated <label>" / "Couldn't save <label>"). */
  label: string;
  /** Persist the whole collection — typically one `mutate` call closing over the entity id. */
  persist: PersistCollection<TValue>;
  /**
   * The last-saved collection when it is known at mount (the loaded entity). Omit when the loaded
   * value only becomes available later — the first `queueSave` then seeds the snapshot silently
   * instead of saving (so the initial load never fires a spurious save).
   */
  initial?: TValue;
  /** Debounce for `queueSave` in ms (the whole-collection standard is 700). */
  debounceMs?: number;
}

interface UseCollectionAutoSaveResult<TValue> {
  /**
   * Debounce-persist the whole collection when it differs from the last-saved snapshot. Each call
   * cancels the previous pending save, so rapid edits coalesce into one request/toast; a value that
   * settles back to the snapshot cancels the pending save entirely. When no snapshot exists yet
   * (no `initial` given), the first call seeds it without saving.
   */
  queueSave: (value: TValue) => void;
  /**
   * Persist immediately (no debounce) if the collection changed — for coupled multi-key sections
   * that save on change (the old `useSectionAutoSave` behavior). Skips no-ops the same way.
   */
  saveNow: (value: TValue) => void;
}

const DEFAULT_DEBOUNCE_MS = 700;

/**
 * The whole-collection sibling of {@link useFieldAutoSave} (edit-tab auto-save standard — no Save
 * button). Some edit surfaces persist an array/section-shaped value as **one** request — a
 * bookmark's property value set, an owner's language usages or entity names, a bookmark's
 * relationships, a property's coupled scope pair — and must report a **single** section-named
 * toast per persisted change. This hook owns the serialize-compare no-op skip (including the
 * initial-load seed), the shared debounce timer, and the success-only snapshot advance (a failed
 * save retries on the next change), mirroring `useFieldAutoSave`'s conventions.
 */
export function useCollectionAutoSave<TValue>({
  id,
  label,
  persist,
  initial,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCollectionAutoSaveParams<TValue>): UseCollectionAutoSaveResult<TValue> {
  // Serialized last-saved snapshot; `null` = not seeded yet. Advanced only on success.
  const savedRef = useRef<string | null>(initial === undefined ? null : JSON.stringify(initial));
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    savedRef.current = initialRef.current === undefined ? null : JSON.stringify(initialRef.current);
    // Re-seed only when the edited entity changes, not on every render (initial is a fresh object
    // each render). Within one entity the snapshot advances on each successful save. `initial` is
    // intentionally omitted from the deps.
  }, [id]);

  // A pending debounced save is cancelled (not flushed) on unmount, matching the effect-cleanup
  // semantics of the hand-rolled implementations this hook replaced.
  useEffect(() => clearTimer, [clearTimer]);

  const fire = useCallback((value: TValue, serialized: string): void => {
    persistRef.current(value, {
      onSuccess: () => {
        savedRef.current = serialized;
        notifyFieldSaved(label);
      },
      onError: error => notifyFieldSaveError(label, describeError(error)),
    });
  }, [label]);

  const queueSave = useCallback((value: TValue): void => {
    clearTimer();
    const serialized = JSON.stringify(value);
    if (savedRef.current === null) {
      // Seed the snapshot on first load without saving.
      savedRef.current = serialized;
      return;
    }
    if (serialized === savedRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fire(value, serialized);
    }, debounceMs);
  }, [clearTimer, debounceMs, fire]);

  const saveNow = useCallback((value: TValue): void => {
    clearTimer();
    const serialized = JSON.stringify(value);
    if (serialized === savedRef.current) return;
    fire(value, serialized);
  }, [clearTimer, fire]);

  return {
    queueSave,
    saveNow,
  };
}

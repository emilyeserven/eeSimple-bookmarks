import { useCallback, useEffect, useRef } from "react";

import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/** The `useUpdateX` mutation shape: `mutate({ id, input }, opts?)`; resolves the full `TEntity`. */
interface UpdateMutation<TInput, TEntity> {
  mutate: (
    vars: { id: string;
      input: Partial<TInput>; },
    opts?: { onSuccess?: (data: TEntity) => void;
      onError?: (error: Error) => void; },
  ) => void;
}

interface UseSectionAutoSaveParams<TInput, TEntity> {
  /** The entity being edited. Switching ids re-seeds the saved snapshot. */
  id: string;
  /** The entity's update mutation (e.g. `useUpdateCustomProperty()`). */
  update: UpdateMutation<TInput, TEntity>;
  /** The last-saved values, used to skip no-op saves. Typically the loaded entity. */
  initial: Partial<TInput>;
}

interface UseSectionAutoSaveResult<TInput> {
  /**
   * Persist a multi-key section together if any key changed: fires one `update.mutate` with all the
   * keys and a single section toast (`Updated <label>` / `Couldn't save <label>`). No-op when every
   * key already matches the last-saved snapshot.
   */
  saveSection: (input: Partial<TInput>, label: string) => void;
}

/** Structural equality good enough for section value bags (booleans, string arrays). */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The multi-key sibling of {@link useFieldAutoSave}. Edit tabs whose section is two coupled fields
 * (e.g. `allCategories` + `categoryIds`) save them in **one** request and report a **single** named
 * toast — calling `saveField` twice would yield two toasts. Skips no-op saves and advances a
 * saved-snapshot ref only after a successful save (so a failed save retries on the next change).
 */
export function useSectionAutoSave<TInput, TEntity = TInput>({
  id,
  update,
  initial,
}: UseSectionAutoSaveParams<TInput, TEntity>): UseSectionAutoSaveResult<TInput> {
  // Last value successfully persisted per key, used to skip no-op saves. Seeded from the loaded
  // entity and advanced on each success. Re-seeded when the edited entity changes.
  const savedRef = useRef<Partial<TInput>>(initial);
  useEffect(() => {
    savedRef.current = initial;
    // Re-seed only when the entity identity changes, not on every render (initial is a fresh object
    // each render). Within one entity the snapshot is advanced by saveSection itself. `initial` is
    // intentionally omitted from the deps.
  }, [id]);

  const saveSection = useCallback(
    (input: Partial<TInput>, label: string): void => {
      const keys = Object.keys(input) as (keyof TInput)[];
      if (keys.every(key => valuesEqual(savedRef.current[key], input[key]))) return;

      update.mutate(
        {
          id,
          input,
        },
        {
          onSuccess: () => {
            savedRef.current = {
              ...savedRef.current,
              ...input,
            };
            notifyFieldSaved(label);
          },
          onError: error => notifyFieldSaveError(label, error.message),
        },
      );
    },
    [id, update],
  );

  return {
    saveSection,
  };
}

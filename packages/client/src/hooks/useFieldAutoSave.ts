import { useCallback, useEffect, useRef } from "react";

import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

/**
 * The `useUpdateX` mutation shape every entity exposes: `mutate({ id, input }, opts?)`. The patch is a
 * `Partial<TInput>`, but the mutation **resolves the full saved entity** (`TEntity`) — so a success
 * callback can read fields the patch never carried (e.g. the recomputed `slug` after a rename).
 */
interface UpdateMutation<TInput, TEntity> {
  mutate: (
    vars: { id: string;
      input: Partial<TInput>; },
    opts?: { onSuccess?: (data: TEntity) => void;
      onError?: (error: Error) => void; },
  ) => void;
}

interface UseFieldAutoSaveParams<TInput, TEntity> {
  /** The entity being edited. Switching ids re-seeds the saved snapshot. */
  id: string;
  /** The entity's update mutation (e.g. `useUpdateCategory()`). */
  update: UpdateMutation<TInput, TEntity>;
  /** Human label per field, used to word the toast ("Updated <label>"). */
  labels: Partial<Record<keyof TInput, string>>;
  /** The last-saved values, used to skip no-op saves. Typically the loaded entity. */
  initial: Partial<TInput>;
}

interface SaveFieldOptions<TEntity> {
  /** When `false`, the value is invalid and no save fires (no toast). Defaults to `true`. */
  valid?: boolean;
  /** Extra success handler, e.g. follow a slug rename. Runs after the snapshot/toast. */
  onSuccess?: (data: TEntity) => void;
}

interface UseFieldAutoSaveResult<TInput, TEntity> {
  /** Persist one field if it changed and is valid; toasts the named field on success/failure. */
  saveField: <K extends keyof TInput>(
    key: K,
    value: TInput[K],
    options?: SaveFieldOptions<TEntity>,
  ) => void;
}

/** Structural equality good enough for field values (primitives, string arrays, plain objects). */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Core of the **edit-tab auto-save standard**. Wires an entity's update mutation so each field
 * persists on its own (single-field PATCH) and reports via {@link notifyFieldSaved} /
 * {@link notifyFieldSaveError}. Skips no-op and invalid values, and advances a saved-snapshot ref
 * only after a successful save (so a failed save retries on the next blur/change). Mirrors the
 * seed/ref discipline of `HomepageContentSettings`, minus the whole-object debounce — text fields
 * call `saveField` on blur, toggles/selects on change.
 */
export function useFieldAutoSave<TInput, TEntity = TInput>({
  id,
  update,
  labels,
  initial,
}: UseFieldAutoSaveParams<TInput, TEntity>): UseFieldAutoSaveResult<TInput, TEntity> {
  // Last value successfully persisted per field, used to skip no-op saves. Seeded from the loaded
  // entity and advanced on each success. Re-seeded when the edited entity changes.
  const savedRef = useRef<Partial<TInput>>(initial);
  useEffect(() => {
    savedRef.current = initial;
    // Re-seed only when the entity identity changes, not on every render (initial is a fresh object
    // each render). Within one entity the snapshot is advanced by saveField itself. `initial` is
    // intentionally omitted from the deps.
  }, [id]);

  const saveField = useCallback(
    <K extends keyof TInput>(key: K, value: TInput[K], options?: SaveFieldOptions<TEntity>): void => {
      if (options?.valid === false) return;
      if (valuesEqual(savedRef.current[key], value)) return;

      const label = labels[key] ?? String(key);
      update.mutate(
        {
          id,
          input: {
            [key]: value,
          } as unknown as Partial<TInput>,
        },
        {
          onSuccess: (data) => {
            savedRef.current = {
              ...savedRef.current,
              [key]: value,
            };
            notifyFieldSaved(label);
            options?.onSuccess?.(data);
          },
          onError: error => notifyFieldSaveError(label, describeError(error)),
        },
      );
    },
    [id, update, labels],
  );

  return {
    saveField,
  };
}

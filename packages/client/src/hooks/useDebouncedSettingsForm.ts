import { useEffect, useRef, useState } from "react";

/** Debounce window (ms) before an edit auto-saves. */
export const SETTINGS_FORM_AUTOSAVE_DELAY_MS = 800;

/** The uniform controls every debounced settings-form hook exposes. */
export interface DebouncedSettingsFormControls<T> {
  form: T;
  /** Merge a partial change into the form and schedule a debounced auto-save. */
  patchForm: (patch: Partial<T>) => void;
  isLoading: boolean;
}

/** The minimal mutation surface this hook needs — the full `UseMutationResult` is assignable to it. */
interface SettingsFormMutation<T> {
  mutate: (value: T) => void;
}

/**
 * Owns a server-persisted settings form: seeds from the server once loaded, debounce-auto-saves each
 * edit, and exposes a `patchForm` merge helper. This is the single implementation behind every
 * per-feature settings-form hook (`useAiAutotagForm` / `useAiBulkEditForm` / `useAiSummarizationForm`
 * / `useBookmarkAiUpdateForm` / `useTagReparentForm`) — they differ only in their data hook, update
 * mutation, and defaults, so each is a thin wrapper that forwards those here.
 */
export function useDebouncedSettingsForm<T>(opts: {
  data: T | undefined;
  isLoading: boolean;
  update: SettingsFormMutation<T>;
  defaults: T;
}): DebouncedSettingsFormControls<T> {
  const {
    data, isLoading, update, defaults,
  } = opts;

  const [form, setFormState] = useState<T>(defaults);
  const formRef = useRef<T>(form);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeededRef = useRef(false);
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    if (data) {
      isSeededRef.current = true;
      formRef.current = data;
      setFormState(data);
    }
  }, [data]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function scheduleAutoSave(): void {
    if (!isSeededRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateRef.current.mutate(formRef.current);
    }, SETTINGS_FORM_AUTOSAVE_DELAY_MS);
  }

  function patchForm(patch: Partial<T>): void {
    const next = {
      ...formRef.current,
      ...patch,
    };
    formRef.current = next;
    setFormState(next);
    scheduleAutoSave();
  }

  return {
    form,
    patchForm,
    isLoading,
  };
}

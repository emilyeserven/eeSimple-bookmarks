import type { TagReparentSettings } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useTagReparentSettings, useUpdateTagReparentSettings, TAG_REPARENT_DEFAULTS } from "./useAppSettings";

/** Debounce window (ms) before a template edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

export interface TagReparentFormControls {
  form: TagReparentSettings;
  /** Merge a partial change into the form and schedule a debounced auto-save. */
  patchForm: (patch: Partial<TagReparentSettings>) => void;
  isLoading: boolean;
}

/**
 * Owns the tag-reparent template form: seeds from the server, debounce-auto-saves edits, and exposes a
 * `patchForm` merge helper. Mirrors `useAiAutotagForm`.
 */
export function useTagReparentForm(): TagReparentFormControls {
  const {
    data, isLoading,
  } = useTagReparentSettings();
  const update = useUpdateTagReparentSettings();

  const [form, setFormState] = useState<TagReparentSettings>(TAG_REPARENT_DEFAULTS);
  const formRef = useRef<TagReparentSettings>(form);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeededRef = useRef(false);

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
      update.mutate(formRef.current);
    }, AUTOSAVE_DELAY_MS);
  }

  function patchForm(patch: Partial<TagReparentSettings>): void {
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

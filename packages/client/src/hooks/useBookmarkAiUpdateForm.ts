import type { BookmarkAiUpdateSettings } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useBookmarkAiUpdateSettings, useUpdateBookmarkAiUpdateSettings, BOOKMARK_AI_UPDATE_DEFAULTS } from "./useAppSettings";

/** Debounce window (ms) before a template edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

export interface BookmarkAiUpdateFormControls {
  form: BookmarkAiUpdateSettings;
  /** Merge a partial change into the form and schedule a debounced auto-save. */
  patchForm: (patch: Partial<BookmarkAiUpdateSettings>) => void;
  isLoading: boolean;
}

/**
 * Owns the bookmark AI-update template form: seeds from the server, debounce-auto-saves edits, and
 * exposes a `patchForm` merge helper. Mirrors `useTagReparentForm`.
 */
export function useBookmarkAiUpdateForm(): BookmarkAiUpdateFormControls {
  const {
    data, isLoading,
  } = useBookmarkAiUpdateSettings();
  const update = useUpdateBookmarkAiUpdateSettings();

  const [form, setFormState] = useState<BookmarkAiUpdateSettings>(BOOKMARK_AI_UPDATE_DEFAULTS);
  const formRef = useRef<BookmarkAiUpdateSettings>(form);
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

  function patchForm(patch: Partial<BookmarkAiUpdateSettings>): void {
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

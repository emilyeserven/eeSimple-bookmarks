import type { AiAutotagSettings as AiAutotagForm } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useAiAutotagSettings, useUpdateAiAutotagSettings, AI_AUTOTAG_DEFAULTS } from "./useAppSettings";

/** Debounce window (ms) before a prompt/settings edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

export interface AiAutotagFormControls {
  form: AiAutotagForm;
  /** Merge a partial change into the form and schedule a debounced auto-save. */
  patchForm: (patch: Partial<AiAutotagForm>) => void;
  isLoading: boolean;
}

/**
 * Owns the AI-autotag settings form: seeds from the server, debounce-auto-saves edits, and exposes a
 * `patchForm` merge helper. Extracted from `AiAutotagSettings` so the component stays under the
 * hook-density complexity cap (see the `decompose-over-cap` skill). Mirrors `useAiSummarizationForm`.
 */
export function useAiAutotagForm(): AiAutotagFormControls {
  const {
    data, isLoading,
  } = useAiAutotagSettings();
  const update = useUpdateAiAutotagSettings();

  const [form, setFormState] = useState<AiAutotagForm>(AI_AUTOTAG_DEFAULTS);
  const formRef = useRef<AiAutotagForm>(form);
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

  function patchForm(patch: Partial<AiAutotagForm>): void {
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

import type { AiSummarizationSettings as AiSummarizationForm } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useAiSummarizationSettings, useUpdateAiSummarizationSettings, AI_SUMMARIZATION_DEFAULTS } from "./useAppSettings";

/** Debounce window (ms) before a prompt/settings edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

export interface AiSummarizationFormControls {
  form: AiSummarizationForm;
  /** Merge a partial change into the form and schedule a debounced auto-save. */
  patchForm: (patch: Partial<AiSummarizationForm>) => void;
  isLoading: boolean;
}

/**
 * Owns the AI-summarization settings form: seeds from the server, debounce-auto-saves edits, and
 * exposes a `patchForm` merge helper. Extracted from `AiSummarizationSettings` so the component stays
 * under the hook-density complexity cap (see the `decompose-over-cap` skill).
 */
export function useAiSummarizationForm(): AiSummarizationFormControls {
  const {
    data, isLoading,
  } = useAiSummarizationSettings();
  const update = useUpdateAiSummarizationSettings();

  const [form, setFormState] = useState<AiSummarizationForm>(AI_SUMMARIZATION_DEFAULTS);
  const formRef = useRef<AiSummarizationForm>(form);
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

  function patchForm(patch: Partial<AiSummarizationForm>): void {
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

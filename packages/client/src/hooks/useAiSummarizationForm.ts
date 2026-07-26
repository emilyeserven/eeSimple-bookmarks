import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { AiSummarizationSettings as AiSummarizationForm } from "@eesimple/types";

import { useAiSummarizationSettings, useUpdateAiSummarizationSettings, AI_SUMMARIZATION_DEFAULTS } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type AiSummarizationFormControls = DebouncedSettingsFormControls<AiSummarizationForm>;

/**
 * Owns the AI-summarization settings form: seeds from the server, debounce-auto-saves edits, and
 * exposes a `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useAiSummarizationForm(): AiSummarizationFormControls {
  const {
    data, isLoading,
  } = useAiSummarizationSettings();
  const update = useUpdateAiSummarizationSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: AI_SUMMARIZATION_DEFAULTS,
  });
}

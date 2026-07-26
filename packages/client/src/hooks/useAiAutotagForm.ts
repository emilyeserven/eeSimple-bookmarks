import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { AiAutotagSettings as AiAutotagForm } from "@eesimple/types";

import { useAiAutotagSettings, useUpdateAiAutotagSettings, AI_AUTOTAG_DEFAULTS } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type AiAutotagFormControls = DebouncedSettingsFormControls<AiAutotagForm>;

/**
 * Owns the AI-autotag settings form: seeds from the server, debounce-auto-saves edits, and exposes a
 * `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useAiAutotagForm(): AiAutotagFormControls {
  const {
    data, isLoading,
  } = useAiAutotagSettings();
  const update = useUpdateAiAutotagSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: AI_AUTOTAG_DEFAULTS,
  });
}

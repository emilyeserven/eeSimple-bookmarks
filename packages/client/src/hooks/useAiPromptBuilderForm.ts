import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { AiPromptBuilderSettings } from "@eesimple/types";

import { AI_PROMPT_BUILDER_DEFAULTS, useAiPromptBuilderSettings, useUpdateAiPromptBuilderSettings } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type AiPromptBuilderFormControls = DebouncedSettingsFormControls<AiPromptBuilderSettings>;

/**
 * Owns the AI Prompt Builder template form: seeds from the server, debounce-auto-saves edits, and
 * exposes a `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useAiPromptBuilderForm(): AiPromptBuilderFormControls {
  const {
    data, isLoading,
  } = useAiPromptBuilderSettings();
  const update = useUpdateAiPromptBuilderSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: AI_PROMPT_BUILDER_DEFAULTS,
  });
}

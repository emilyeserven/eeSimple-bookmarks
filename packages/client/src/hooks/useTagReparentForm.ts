import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { TagReparentSettings } from "@eesimple/types";

import { useTagReparentSettings, useUpdateTagReparentSettings, TAG_REPARENT_DEFAULTS } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type TagReparentFormControls = DebouncedSettingsFormControls<TagReparentSettings>;

/**
 * Owns the tag-reparent template form: seeds from the server, debounce-auto-saves edits, and exposes a
 * `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useTagReparentForm(): TagReparentFormControls {
  const {
    data, isLoading,
  } = useTagReparentSettings();
  const update = useUpdateTagReparentSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: TAG_REPARENT_DEFAULTS,
  });
}

import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { AiBulkEditSettings } from "@eesimple/types";

import { useAiBulkEditSettings, useUpdateAiBulkEditSettings, AI_BULK_EDIT_DEFAULTS } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type AiBulkEditFormControls = DebouncedSettingsFormControls<AiBulkEditSettings>;

/**
 * Owns the AI Bulk Edit template form: seeds from the server, debounce-auto-saves edits, and exposes a
 * `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useAiBulkEditForm(): AiBulkEditFormControls {
  const {
    data, isLoading,
  } = useAiBulkEditSettings();
  const update = useUpdateAiBulkEditSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: AI_BULK_EDIT_DEFAULTS,
  });
}

import type { DebouncedSettingsFormControls } from "./useDebouncedSettingsForm";
import type { BookmarkAiUpdateSettings } from "@eesimple/types";

import { useBookmarkAiUpdateSettings, useUpdateBookmarkAiUpdateSettings, BOOKMARK_AI_UPDATE_DEFAULTS } from "./useAppSettings";
import { useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

export type BookmarkAiUpdateFormControls = DebouncedSettingsFormControls<BookmarkAiUpdateSettings>;

/**
 * Owns the bookmark AI-update template form: seeds from the server, debounce-auto-saves edits, and
 * exposes a `patchForm` merge helper. A thin wrapper over the shared {@link useDebouncedSettingsForm}.
 */
export function useBookmarkAiUpdateForm(): BookmarkAiUpdateFormControls {
  const {
    data, isLoading,
  } = useBookmarkAiUpdateSettings();
  const update = useUpdateBookmarkAiUpdateSettings();
  return useDebouncedSettingsForm({
    data,
    isLoading,
    update,
    defaults: BOOKMARK_AI_UPDATE_DEFAULTS,
  });
}

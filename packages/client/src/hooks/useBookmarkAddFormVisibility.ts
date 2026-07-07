import type { ResolvedBookmarkAddForm } from "../lib/bookmarkAddForm";
import type { BookmarkAddFormSettings, BookmarkAddFormStandardField } from "@eesimple/types";

import { useMemo } from "react";

import { useBookmarkAddFormConfig } from "./useAppSettings";
import { resolveBookmarkAddForm } from "../lib/bookmarkAddForm";

/**
 * Resolves where each Add Bookmark form field renders for the current surface. In edit mode the
 * resolver ignores the saved placement settings and returns today's fixed split; in create mode it
 * buckets fields by the user's Settings → Display → Add Bookmark Form placements. When the
 * "reveal auto-filled in main" setting is on, `autofilledFields` (the create form's runtime set of
 * automation-filled field keys) lifts those fields into the main area. Falls back to the defaults
 * (today's behavior) while the settings query loads or errors.
 *
 * `config` defaults to the saved settings, but a caller can pass a pre-resolved config — e.g. the
 * create form threads the Advanced-Rules-merged config from {@link useBookmarkAddFormEffectiveConfig}
 * so conditional placement overrides take effect. Edit mode ignores the config regardless.
 */
export function useBookmarkAddFormVisibility(
  isEdit: boolean,
  autofilledFields?: ReadonlySet<BookmarkAddFormStandardField>,
  config?: BookmarkAddFormSettings,
): ResolvedBookmarkAddForm {
  const savedConfig = useBookmarkAddFormConfig();
  const resolvedConfig = config ?? savedConfig;
  return useMemo(
    () => resolveBookmarkAddForm(resolvedConfig, isEdit, autofilledFields),
    [resolvedConfig, isEdit, autofilledFields],
  );
}

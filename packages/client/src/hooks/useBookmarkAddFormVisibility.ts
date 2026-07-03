import type { ResolvedBookmarkAddForm } from "../lib/bookmarkAddForm";

import { useMemo } from "react";

import { useBookmarkAddFormConfig } from "./useAppSettings";
import { resolveBookmarkAddForm } from "../lib/bookmarkAddForm";

/**
 * Resolves where each Add Bookmark form field renders for the current surface. In edit mode the
 * resolver ignores the saved placement settings and returns today's fixed split; in create mode it
 * buckets fields by the user's Settings → Display → Add Bookmark Form placements. Falls back to the
 * defaults (today's behavior) while the settings query loads or errors.
 */
export function useBookmarkAddFormVisibility(isEdit: boolean): ResolvedBookmarkAddForm {
  const config = useBookmarkAddFormConfig();
  return useMemo(() => resolveBookmarkAddForm(config, isEdit), [config, isEdit]);
}

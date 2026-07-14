import type { BookmarkAddFormSettings, UpdateBookmarkAddFormInput } from "@eesimple/types";

import { DEFAULT_BOOKMARK_ADD_FORM_SETTINGS } from "@eesimple/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";

const BOOKMARK_ADD_FORM_KEY = ["app-settings", "bookmark-add-form"] as const;

/** Bookmark-add-form settings (group): field placement for the Add Bookmark form. */
export function useBookmarkAddFormSettings() {
  return useQuery({
    queryKey: BOOKMARK_ADD_FORM_KEY,
    queryFn: appSettingsApi.getBookmarkAddForm,
  });
}

export function useUpdateBookmarkAddFormSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookmarkAddFormInput) =>
      appSettingsApi.updateBookmarkAddForm(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(BOOKMARK_ADD_FORM_KEY, saved);
    },
  });
}

/**
 * The resolved bookmark-add-form settings, falling back to
 * {@link DEFAULT_BOOKMARK_ADD_FORM_SETTINGS} while loading or on error — the create form then
 * behaves as it does today (today's Advanced-section fields stay Advanced, detail properties stay
 * hidden).
 */
export function useBookmarkAddFormConfig(): BookmarkAddFormSettings {
  const {
    data,
  } = useBookmarkAddFormSettings();
  return data ?? DEFAULT_BOOKMARK_ADD_FORM_SETTINGS;
}

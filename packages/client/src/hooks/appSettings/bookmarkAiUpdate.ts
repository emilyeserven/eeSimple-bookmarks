import type { BookmarkAiUpdateSettings, UpdateBookmarkAiUpdateInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const BOOKMARK_AI_UPDATE_KEY = ["app-settings", "bookmark-ai-update"] as const;

const BOOKMARK_AI_UPDATE_DEFAULTS: BookmarkAiUpdateSettings = {
  bookmarkAiUpdatePrompt: "",
};

/** The stored bookmark AI-update prompt template. */
export function useBookmarkAiUpdateSettings() {
  return useQuery({
    queryKey: BOOKMARK_AI_UPDATE_KEY,
    queryFn: appSettingsApi.getBookmarkAiUpdate,
  });
}

export function useUpdateBookmarkAiUpdateSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateBookmarkAiUpdateInput) =>
      appSettingsApi.updateBookmarkAiUpdate(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(BOOKMARK_AI_UPDATE_KEY, saved);
      notifySuccess(t("Bookmark AI update prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { BOOKMARK_AI_UPDATE_DEFAULTS };

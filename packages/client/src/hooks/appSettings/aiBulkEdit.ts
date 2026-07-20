import type { AiBulkEditSettings, UpdateAiBulkEditInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const AI_BULK_EDIT_KEY = ["app-settings", "ai-bulk-edit"] as const;

const AI_BULK_EDIT_DEFAULTS: AiBulkEditSettings = {
  aiBulkEditPrompt: "",
  aiBulkEditExcludedTagIds: [],
  aiBulkEditPreferLeafTags: true,
};

/** The stored AI Bulk Edit prompt template. */
export function useAiBulkEditSettings() {
  return useQuery({
    queryKey: AI_BULK_EDIT_KEY,
    queryFn: appSettingsApi.getAiBulkEdit,
  });
}

export function useUpdateAiBulkEditSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateAiBulkEditInput) =>
      appSettingsApi.updateAiBulkEdit(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_BULK_EDIT_KEY, saved);
      notifySuccess(t("AI bulk edit prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { AI_BULK_EDIT_DEFAULTS };

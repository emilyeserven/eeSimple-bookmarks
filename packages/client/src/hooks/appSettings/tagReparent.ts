import type { TagReparentSettings, UpdateTagReparentInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const TAG_REPARENT_KEY = ["app-settings", "tag-reparent"] as const;

const TAG_REPARENT_DEFAULTS: TagReparentSettings = {
  tagReparentPrompt: "",
};

/** The stored tag reparent prompt template. */
export function useTagReparentSettings() {
  return useQuery({
    queryKey: TAG_REPARENT_KEY,
    queryFn: appSettingsApi.getTagReparent,
  });
}

export function useUpdateTagReparentSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateTagReparentInput) =>
      appSettingsApi.updateTagReparent(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(TAG_REPARENT_KEY, saved);
      notifySuccess(t("Tag reparent prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { TAG_REPARENT_DEFAULTS };

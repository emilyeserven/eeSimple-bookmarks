import type { UpdateHomepageContentInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const HOMEPAGE_CONTENT_KEY = ["app-settings", "homepage-content"] as const;

/** Homepage content settings: the homepage text and Bookmark Quick Add configuration. */
export function useHomepageContentSettings() {
  return useQuery({
    queryKey: HOMEPAGE_CONTENT_KEY,
    queryFn: appSettingsApi.getHomepageContent,
  });
}

export function useUpdateHomepageContentSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateHomepageContentInput) =>
      appSettingsApi.updateHomepageContent(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(HOMEPAGE_CONTENT_KEY, saved);
      notifySuccess(t("Homepage content saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

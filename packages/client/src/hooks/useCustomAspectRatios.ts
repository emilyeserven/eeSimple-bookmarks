import type { CreateCustomAspectRatioInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { customAspectRatiosApi } from "../lib/api/settings";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

const CUSTOM_ASPECT_RATIOS_KEY = ["custom-aspect-ratios"] as const;

export function useCustomAspectRatios() {
  return useQuery({
    queryKey: CUSTOM_ASPECT_RATIOS_KEY,
    queryFn: customAspectRatiosApi.list,
  });
}

export function useCreateCustomAspectRatio() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateCustomAspectRatioInput) => customAspectRatiosApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CUSTOM_ASPECT_RATIOS_KEY,
      });
      notifySuccess(t("Aspect ratio saved"));
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to save aspect ratio"));
    },
  });
}

export function useDeleteCustomAspectRatio() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => customAspectRatiosApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CUSTOM_ASPECT_RATIOS_KEY,
      });
      notifySuccess(t("Aspect ratio deleted"));
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to delete aspect ratio"));
    },
  });
}

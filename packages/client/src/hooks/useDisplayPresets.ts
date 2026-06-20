import type {
  CreateDisplayPresetInput,
  UpdateDisplayPresetInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { displayPresetsApi } from "../lib/api";
import { notifyError, notifySuccess } from "../lib/notifications";

const DISPLAY_PRESETS_KEY = ["display-presets"] as const;

export function useDisplayPresets() {
  return useQuery({
    queryKey: DISPLAY_PRESETS_KEY,
    queryFn: displayPresetsApi.list,
  });
}

export function useCreateDisplayPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDisplayPresetInput) => displayPresetsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DISPLAY_PRESETS_KEY,
      });
      notifySuccess("Display preset saved");
    },
    onError: (err: Error) => {
      notifyError(err.message || "Failed to save display preset");
    },
  });
}

export function useUpdateDisplayPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateDisplayPresetInput; }) => displayPresetsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DISPLAY_PRESETS_KEY,
      });
      notifySuccess("Display preset updated");
    },
    onError: (err: Error) => {
      notifyError(err.message || "Failed to update display preset");
    },
  });
}

export function useDeleteDisplayPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => displayPresetsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DISPLAY_PRESETS_KEY,
      });
      notifySuccess("Display preset deleted");
    },
    onError: (err: Error) => {
      notifyError(err.message || "Failed to delete display preset");
    },
  });
}

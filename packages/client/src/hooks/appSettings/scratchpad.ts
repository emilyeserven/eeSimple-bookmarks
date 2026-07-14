import type { UpdateScratchpadInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../../lib/autoSave";

const SCRATCHPAD_KEY = ["app-settings", "scratchpad"] as const;

/** The stored Scratchpad note (free-form Markdown kept in the sidebar footer). */
export function useScratchpadSettings() {
  return useQuery({
    queryKey: SCRATCHPAD_KEY,
    queryFn: appSettingsApi.getScratchpad,
  });
}

export function useUpdateScratchpadSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateScratchpadInput) =>
      appSettingsApi.updateScratchpad(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(SCRATCHPAD_KEY, saved);
      notifyFieldSaved("Scratchpad");
    },
    onError: error => notifyFieldSaveError("Scratchpad", describeError(error)),
  });
}
